const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class WarehouseService {
  async getWarehouses() {
    const result = await db.query(`
      SELECT w.*, COUNT(l.id)::int AS total_locations
      FROM warehouses w
      LEFT JOIN locations l ON w.id = l.warehouse_id
      GROUP BY w.id
      ORDER BY w.name ASC
    `);
    return result.rows;
  }

  async createWarehouse({ name, code, address }) {
    if (!name || !code) {
      throw new AppError('Warehouse name and short code are required.', 400, 'MISSING_FIELDS');
    }

    const result = await db.query(
      `INSERT INTO warehouses (name, code, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), code.trim().toUpperCase(), address ? address.trim() : '']
    );
    return result.rows[0];
  }

  async updateWarehouse(id, { name, code, address }) {
    const result = await db.query(
      `UPDATE warehouses
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           address = COALESCE($3, address)
       WHERE id = $4
       RETURNING *`,
      [name ? name.trim() : null, code ? code.trim().toUpperCase() : null, address ? address.trim() : null, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Warehouse not found.', 404, 'NOT_FOUND');
    }
    return result.rows[0];
  }

  async getLocations(warehouseId) {
    let query = `
      SELECT l.*, w.name AS warehouse_name, w.code AS warehouse_code
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
    `;
    const params = [];

    if (warehouseId) {
      params.push(parseInt(warehouseId, 10));
      query += ` WHERE l.warehouse_id = $1`;
    }

    query += ` ORDER BY w.name, l.code ASC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  async createLocation({ warehouse_id, name, code }) {
    if (!warehouse_id || !name || !code) {
      throw new AppError('Warehouse ID, location name, and code are required.', 400, 'MISSING_FIELDS');
    }

    const result = await db.query(
      `INSERT INTO locations (warehouse_id, name, code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [warehouse_id, name.trim(), code.trim()]
    );
    return result.rows[0];
  }

  async updateLocation(id, { warehouse_id, name, code }) {
    const result = await db.query(
      `UPDATE locations
       SET warehouse_id = COALESCE($1, warehouse_id),
           name = COALESCE($2, name),
           code = COALESCE($3, code)
       WHERE id = $4
       RETURNING *`,
      [warehouse_id, name ? name.trim() : null, code ? code.trim() : null, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Location not found.', 404, 'NOT_FOUND');
    }
    return result.rows[0];
  }
}

module.exports = new WarehouseService();
