const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'praveen',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

const targetDbName = process.env.DB_NAME || 'stocksense_db';

async function migrate() {
  console.log('=====================================================');
  console.log('--- StockSense Production Database Migration ---');
  console.log('=====================================================');

  // Step 1: Connect to Admin DB (postgres) to verify/create target database
  const adminClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('1. Connected to PostgreSQL Server (Admin DB: postgres).');

    const checkDbRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );

    if (checkDbRes.rows.length === 0) {
      console.log(`   Database "${targetDbName}" not found. Creating...`);
      await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`   ✓ Database "${targetDbName}" created.`);
    } else {
      console.log(`   ✓ Database "${targetDbName}" exists.`);
    }
  } catch (err) {
    console.error('Error connecting to admin database:', err);
    throw err;
  } finally {
    await adminClient.end();
  }

  // Step 2: Connect to target database and execute updated schema DDL
  const targetPool = new Pool({
    ...dbConfig,
    database: targetDbName,
  });

  try {
    console.log(`2. Applying schema DDL to "${targetDbName}"...`);
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

    // Run schema in transaction
    await targetPool.query('BEGIN');
    await targetPool.query(schemaSql);
    await targetPool.query('COMMIT');
    console.log('   ✓ Schema, constraints, foreign keys, and indexes applied successfully.');

    // Step 3: Check and seed initial data
    console.log('3. Checking and seeding initial dynamic records...');
    const userCheck = await targetPool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      // Seed Demo Users (Manager & Staff)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const userRes = await targetPool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES 
          ('Demo Manager', 'demo@stocksense.app', $1, 'manager'),
          ('Jordan Lee (Manager)', 'manager@stocksense.app', $1, 'manager'),
          ('Sam Taylor (Staff)', 'staff@stocksense.app', $1, 'staff')
         RETURNING id, role`,
        [hashedPassword]
      );
      const userId = userRes.rows[0].id;

      // Seed Warehouses
      const whRes = await targetPool.query(
        `INSERT INTO warehouses (name, code, address)
         VALUES 
          ('Main Warehouse', 'WH', '12 Industrial Ave, Sector 4'),
          ('Production Facility', 'PF', '88 Factory Blvd, Bay 2')
         RETURNING id, code`
      );
      const wh1Id = whRes.rows.find((r) => r.code === 'WH').id;
      const wh2Id = whRes.rows.find((r) => r.code === 'PF').id;

      // Seed Locations
      const locRes = await targetPool.query(
        `INSERT INTO locations (warehouse_id, name, code)
         VALUES 
          ($1, 'Stock', 'WH/Stock'),
          ($1, 'Production Rack', 'WH/Rack'),
          ($1, 'Output Bay', 'WH/Output'),
          ($2, 'Line 1 Buffer', 'PF/Line1')
         RETURNING id, code`,
        [wh1Id, wh2Id]
      );
      const stockLocId = locRes.rows.find((r) => r.code === 'WH/Stock').id;
      const rackLocId = locRes.rows.find((r) => r.code === 'WH/Rack').id;

      // Seed Partners
      const partnerRes = await targetPool.query(
        `INSERT INTO partners (name, type, email, phone)
         VALUES 
          ('Acme Vendor', 'vendor', 'supplier@acme.com', '+1-555-0101'),
          ('Global Metals Ltd', 'vendor', 'orders@globalmetals.com', '+1-555-0102'),
          ('Acme Customer', 'customer', 'procurement@acmecorp.com', '+1-555-0199'),
          ('BuildTech Industries', 'customer', 'sales@buildtech.com', '+1-555-0188')
         RETURNING id, name`
      );
      const vendorId = partnerRes.rows.find((r) => r.name === 'Acme Vendor').id;
      const customerId = partnerRes.rows.find((r) => r.name === 'Acme Customer').id;

      // Seed Products
      const prodRes = await targetPool.query(
        `INSERT INTO products (name, sku, category, uom, reorder_point)
         VALUES 
          ('Steel Rods', 'STL-001', 'Raw Material', 'kg', 20),
          ('Wood Frames', 'WD-014', 'Component', 'unit', 10),
          ('Fastener Bolts', 'FST-99', 'Hardware', 'unit', 50),
          ('Aluminum Sheets', 'ALM-102', 'Raw Material', 'm', 15)
         RETURNING id, sku`
      );
      const pSteel = prodRes.rows.find((r) => r.sku === 'STL-001');
      const pWood = prodRes.rows.find((r) => r.sku === 'WD-014');
      const pBolts = prodRes.rows.find((r) => r.sku === 'FST-99');
      const pAlum = prodRes.rows.find((r) => r.sku === 'ALM-102');

      // Seed Stock Levels
      await targetPool.query(
        `INSERT INTO stock_levels (product_id, location_id, quantity)
         VALUES 
          ($1, $2, 100),
          ($3, $2, 40),
          ($4, $2, 250),
          ($5, $6, 8)`,
        [pSteel.id, stockLocId, pWood.id, pBolts.id, pAlum.id, rackLocId]
      );

      // Seed Initial Operations & Lines
      const recRes = await targetPool.query(
        `INSERT INTO operations (type, reference, partner_id, dest_location_id, scheduled_date, status, created_by)
         VALUES ('receipt', 'WH/IN/0001', $1, $2, CURRENT_DATE - INTERVAL '2 days', 'Done', $3)
         RETURNING id`,
        [vendorId, stockLocId, userId]
      );
      await targetPool.query(
        `INSERT INTO operation_lines (operation_id, product_id, quantity)
         VALUES ($1, $2, 100)`,
        [recRes.rows[0].id, pSteel.id]
      );

      // Seed Immutable Stock Moves (Ledger) with product_id foreign keys
      await targetPool.query(
        `INSERT INTO stock_moves (operation_id, reference, date, operation_type, from_location, to_location, product_id, quantity, status)
         VALUES 
          ($1, 'WH/IN/0001', CURRENT_DATE - INTERVAL '2 days', 'Receipt', 'Acme Vendor', 'WH/Stock', $2, 100, 'Done'),
          (NULL, 'INITIAL', CURRENT_DATE - INTERVAL '2 days', 'Initial Inventory', 'Initial Balance', 'WH/Stock', $3, 40, 'Done'),
          (NULL, 'INITIAL', CURRENT_DATE - INTERVAL '1 days', 'Initial Inventory', 'Initial Balance', 'WH/Stock', $4, 250, 'Done'),
          (NULL, 'INITIAL', CURRENT_DATE - INTERVAL '1 days', 'Initial Inventory', 'Initial Balance', 'WH/Rack', $5, 8, 'Done')`,
        [recRes.rows[0].id, pSteel.id, pWood.id, pBolts.id, pAlum.id]
      );

      // Delivery Order
      const delRes = await targetPool.query(
        `INSERT INTO operations (type, reference, partner_id, source_location_id, scheduled_date, status, created_by)
         VALUES ('delivery', 'WH/OUT/0001', $1, $2, CURRENT_DATE, 'Ready', $3)
         RETURNING id`,
        [customerId, stockLocId, userId]
      );
      await targetPool.query(
        `INSERT INTO operation_lines (operation_id, product_id, quantity)
         VALUES ($1, $2, 10)`,
        [delRes.rows[0].id, pWood.id]
      );

      // Internal Transfer
      const transRes = await targetPool.query(
        `INSERT INTO operations (type, reference, source_location_id, dest_location_id, scheduled_date, status, created_by)
         VALUES ('transfer', 'WH/INT/0001', $1, $2, CURRENT_DATE + INTERVAL '1 days', 'Ready', $3)
         RETURNING id`,
        [stockLocId, rackLocId, userId]
      );
      await targetPool.query(
        `INSERT INTO operation_lines (operation_id, product_id, quantity)
         VALUES ($1, $2, 20)`,
        [transRes.rows[0].id, pSteel.id]
      );

      console.log('   ✓ Seed data inserted with strict foreign keys.');
    } else {
      console.log('   ✓ Existing data preserved.');
    }

    console.log('=====================================================');
    console.log('--- Migration Completed Successfully ---');
    console.log('=====================================================');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    await targetPool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
