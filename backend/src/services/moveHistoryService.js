const db = require('../config/db');

class MoveHistoryService {
  async getMoveHistory({ search, type, dateFrom, dateTo }) {
    let query = `
      SELECT 
        sm.id,
        sm.operation_id,
        sm.reference,
        sm.date,
        sm.operation_type,
        sm.from_location,
        sm.to_location,
        sm.product_id,
        CONCAT(p.name, ' (', p.uom, ')') AS product_name,
        p.sku AS product_sku,
        sm.quantity,
        sm.status,
        sm.created_at
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND sm.operation_type ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (
        sm.reference ILIKE $${params.length} 
        OR p.name ILIKE $${params.length} 
        OR p.sku ILIKE $${params.length} 
        OR sm.from_location ILIKE $${params.length} 
        OR sm.to_location ILIKE $${params.length}
      )`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND sm.date >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      query += ` AND sm.date <= $${params.length}`;
    }

    query += ` ORDER BY sm.date DESC, sm.id DESC LIMIT 250`;

    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = new MoveHistoryService();
