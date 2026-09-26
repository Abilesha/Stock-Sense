const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class ProductService {
  async getAllProducts({ category, search }) {
    let query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.uom,
        p.reorder_point,
        COALESCE(SUM(sl.quantity), 0)::numeric AS on_hand,
        p.created_at
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
    }

    query += `
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

    const result = await db.query(query, params);

    // Calculate reserved quantities for pending Delivery orders
    const reservedRes = await db.query(`
      SELECT ol.product_id, COALESCE(SUM(ol.quantity), 0)::numeric AS reserved
      FROM operation_lines ol
      JOIN operations o ON ol.operation_id = o.id
      WHERE o.type = 'delivery' AND o.status IN ('Ready', 'Waiting')
      GROUP BY ol.product_id
    `);

    const reservedMap = {};
    reservedRes.rows.forEach((r) => {
      reservedMap[r.product_id] = parseFloat(r.reserved);
    });

    return result.rows.map((p) => {
      const onHand = parseFloat(p.on_hand);
      const reserved = reservedMap[p.id] || 0;
      const free = Math.max(0, onHand - reserved);
      const isLow = onHand <= parseFloat(p.reorder_point);
      return {
        ...p,
        on_hand: onHand,
        reserved,
        free_to_use: free,
        is_low_stock: isLow,
      };
    });
  }

  async getProductById(id) {
    const prodRes = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }
    const product = prodRes.rows[0];

    const stockRes = await db.query(
      `SELECT l.id AS location_id, l.name AS location_name, l.code AS location_code,
              w.name AS warehouse_name, COALESCE(sl.quantity, 0)::numeric AS quantity
       FROM locations l
       JOIN warehouses w ON l.warehouse_id = w.id
       LEFT JOIN stock_levels sl ON sl.location_id = l.id AND sl.product_id = $1
       ORDER BY w.name, l.code`,
      [id]
    );

    return {
      ...product,
      stock_by_location: stockRes.rows,
    };
  }

  async createProduct({ name, sku, category, uom, reorder_point, initial_stock }) {
    if (!name || !sku || !category) {
      throw new AppError('Name, SKU/Code, and Category are required.', 400, 'MISSING_FIELDS');
    }

    return db.withTransaction(async (client) => {
      const insertRes = await client.query(
        `INSERT INTO products (name, sku, category, uom, reorder_point)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name.trim(), sku.trim().toUpperCase(), category.trim(), uom ? uom.trim() : 'unit', reorder_point || 0]
      );
      const product = insertRes.rows[0];

      if (initial_stock && Array.isArray(initial_stock)) {
        for (const item of initial_stock) {
          const qty = parseFloat(item.quantity) || 0;
          if (qty > 0 && item.location_id) {
            await client.query(
              `INSERT INTO stock_levels (product_id, location_id, quantity)
               VALUES ($1, $2, $3)
               ON CONFLICT (product_id, location_id)
               DO UPDATE SET quantity = stock_levels.quantity + $3`,
              [product.id, item.location_id, qty]
            );

            const locRes = await client.query('SELECT code FROM locations WHERE id = $1', [item.location_id]);
            const locCode = locRes.rows[0] ? locRes.rows[0].code : 'WH/Stock';

            await client.query(
              `INSERT INTO stock_moves (reference, date, operation_type, from_location, to_location, product_id, quantity, status)
               VALUES ('INITIAL', CURRENT_DATE, 'Initial Inventory', 'Inventory Adjustment', $1, $2, $3, 'Done')`,
              [locCode, product.id, qty]
            );
          }
        }
      }

      return product;
    });
  }

  async updateProduct(id, { name, sku, category, uom, reorder_point, stock_by_location }) {
    if (!name || !sku || !category) {
      throw new AppError('Name, SKU/Code, and Category are required.', 400, 'MISSING_FIELDS');
    }

    return db.withTransaction(async (client) => {
      const updateRes = await client.query(
        `UPDATE products
         SET name = $1, sku = $2, category = $3, uom = $4, reorder_point = $5
         WHERE id = $6
         RETURNING *`,
        [name.trim(), sku.trim().toUpperCase(), category.trim(), uom ? uom.trim() : 'unit', reorder_point || 0, id]
      );

      if (updateRes.rows.length === 0) {
        throw new AppError('Product not found.', 404, 'NOT_FOUND');
      }

      if (stock_by_location && Array.isArray(stock_by_location)) {
        for (const locItem of stock_by_location) {
          const qty = parseFloat(locItem.quantity) || 0;
          await client.query(
            `INSERT INTO stock_levels (product_id, location_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, location_id)
             DO UPDATE SET quantity = $3`,
            [id, locItem.location_id, qty]
          );
        }
      }

      return updateRes.rows[0];
    });
  }

  async deleteProduct(id) {
    const opCheck = await db.query(
      `SELECT 1 FROM operation_lines WHERE product_id = $1 
       UNION 
       SELECT 1 FROM stock_moves WHERE product_id = $1 LIMIT 1`,
      [id]
    );

    if (opCheck.rows.length > 0) {
      throw new AppError(
        'Cannot delete product because it has recorded movements or active operation references in the system.',
        400,
        'PRODUCT_IN_USE'
      );
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);
    return { success: true };
  }
}

module.exports = new ProductService();
