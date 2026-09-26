/**
 * Concurrency Test Script for StockSense
 *
 * Verifies that concurrent validations for the same stock inventory
 * are handled atomically with row-locking (FOR UPDATE):
 * - Exactly ONE order succeeds.
 * - The competing order fails with INSUFFICIENT_STOCK (422).
 * - Total stock never goes negative (ACID guarantee).
 */

const db = require('../src/config/db');
const operationService = require('../src/services/operationService');
const productService = require('../src/services/productService');

async function runConcurrencyTest() {
  console.log('========================================================');
  console.log('--- StockSense Inventory ACID Concurrency Stress Test ---');
  console.log('========================================================\n');

  try {
    // 1. Setup: Create test product with exact stock = 10
    const locRes = await db.query("SELECT id, code FROM locations WHERE code = 'WH/Stock'");
    const stockLocId = locRes.rows[0].id;

    const partnerRes = await db.query("SELECT id FROM partners WHERE type = 'customer' LIMIT 1");
    const customerId = partnerRes.rows[0].id;

    const userRes = await db.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;

    const sku = `TEST-RACE-${Date.now().toString().slice(-4)}`;
    console.log(`1. Creating Test Product [SKU: ${sku}] with initial stock = 10...`);

    const product = await productService.createProduct({
      name: `Race Condition Test Item (${sku})`,
      sku,
      category: 'Hardware',
      uom: 'unit',
      reorder_point: 5,
      initial_stock: [{ location_id: stockLocId, quantity: 10 }],
    });

    console.log(`   ✓ Product created (ID: ${product.id}). Initial WH/Stock = 10 units.\n`);

    // 2. Create Order A (requesting 10 units)
    console.log('2. Creating Order A (requesting 10 units)...');
    const orderA = await operationService.createOperation({
      type: 'delivery',
      partner_id: customerId,
      source_location_id: stockLocId,
      scheduled_date: new Date(),
      lines: [{ product_id: product.id, quantity: 10 }],
      userId,
    });
    console.log(`   ✓ Order A created: Reference ${orderA.reference} (ID: ${orderA.id})`);

    // 3. Create Order B (competing for same 10 units)
    console.log('3. Creating Order B (requesting 10 units concurrently)...');
    const orderB = await operationService.createOperation({
      type: 'delivery',
      partner_id: customerId,
      source_location_id: stockLocId,
      scheduled_date: new Date(),
      lines: [{ product_id: product.id, quantity: 10 }],
      userId,
    });
    console.log(`   ✓ Order B created: Reference ${orderB.reference} (ID: ${orderB.id})\n`);

    // 4. Fire simultaneous validations in parallel
    console.log('4. Firing parallel concurrent validation requests...');
    const startTime = Date.now();

    const results = await Promise.allSettled([
      operationService.validateOperation(orderA.id),
      operationService.validateOperation(orderB.id),
    ]);

    const durationMs = Date.now() - startTime;
    console.log(`   Finished parallel processing in ${durationMs}ms.\n`);

    // 5. Inspect Results
    console.log('5. Validation Results:');
    let successCount = 0;
    let failedCount = 0;

    results.forEach((res, idx) => {
      const orderName = idx === 0 ? 'Order A' : 'Order B';
      if (res.status === 'fulfilled') {
        successCount++;
        console.log(`   ✓ ${orderName}: SUCCEEDED (Status: ${res.value.status})`);
      } else {
        failedCount++;
        console.log(`   ✗ ${orderName}: REJECTED AS EXPECTED (Code: ${res.reason.code}, Message: ${res.reason.message})`);
      }
    });

    // 6. Verify final stock balance in PostgreSQL
    const finalStockRes = await db.query(
      'SELECT quantity FROM stock_levels WHERE product_id = $1 AND location_id = $2',
      [product.id, stockLocId]
    );
    const finalStock = parseFloat(finalStockRes.rows[0].quantity);

    console.log(`\n6. Final Stock Balance Verification:`);
    console.log(`   Recorded Stock in WH/Stock: ${finalStock} units`);

    // Assertions
    if (successCount === 1 && failedCount === 1 && finalStock === 0) {
      console.log('\n========================================================');
      console.log('>>> TEST PASSED: ACID Concurrency Protection Verified! <<<');
      console.log('Zero double-spending. Zero negative stock balances.');
      console.log('========================================================\n');
    } else {
      console.error('\n>>> TEST FAILED: Race condition detected! <<<\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

runConcurrencyTest();
