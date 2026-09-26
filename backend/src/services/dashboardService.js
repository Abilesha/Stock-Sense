const db = require('../config/db');

class DashboardService {
  async getDashboardSummary({ warehouseId, locationId, category }) {
    const totalProductsQuery = `
      SELECT COUNT(DISTINCT p.id)::int AS total
      FROM products p
      WHERE ($1::text IS NULL OR p.category = $1)
    `;
    const totalProductsRes = await db.query(totalProductsQuery, [category || null]);
    const totalProducts = totalProductsRes.rows[0].total || 0;

    const lowStockQuery = `
      SELECT COUNT(DISTINCT p.id)::int AS total
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN locations l ON sl.location_id = l.id
      WHERE ($1::text IS NULL OR p.category = $1)
        AND ($2::int IS NULL OR l.warehouse_id = $2)
        AND ($3::int IS NULL OR l.id = $3)
      GROUP BY p.id, p.reorder_point
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
    `;
    const lowStockRes = await db.query(lowStockQuery, [
      category || null,
      warehouseId ? parseInt(warehouseId, 10) : null,
      locationId ? parseInt(locationId, 10) : null,
    ]);
    const lowStockCount = lowStockRes.rows.length;

    const pendingReceiptsRes = await db.query(
      `SELECT COUNT(*)::int AS total 
       FROM operations 
       WHERE type = 'receipt' AND status NOT IN ('Done', 'Canceled')`
    );
    const pendingReceipts = pendingReceiptsRes.rows[0].total || 0;

    const pendingDeliveriesRes = await db.query(
      `SELECT COUNT(*)::int AS total 
       FROM operations 
       WHERE type = 'delivery' AND status NOT IN ('Done', 'Canceled')`
    );
    const pendingDeliveries = pendingDeliveriesRes.rows[0].total || 0;

    const pendingTransfersRes = await db.query(
      `SELECT COUNT(*)::int AS total 
       FROM operations 
       WHERE type = 'transfer' AND status NOT IN ('Done', 'Canceled')`
    );
    const scheduledTransfers = pendingTransfersRes.rows[0].total || 0;

    const recentReceiptsRes = await db.query(
      `SELECT o.id, o.reference, o.status, o.scheduled_date, p.name AS partner_name, l.code AS location_code
       FROM operations o
       LEFT JOIN partners p ON o.partner_id = p.id
       LEFT JOIN locations l ON o.dest_location_id = l.id
       WHERE o.type = 'receipt'
       ORDER BY o.created_at DESC LIMIT 5`
    );

    const recentDeliveriesRes = await db.query(
      `SELECT o.id, o.reference, o.status, o.scheduled_date, p.name AS partner_name, l.code AS location_code
       FROM operations o
       LEFT JOIN partners p ON o.partner_id = p.id
       LEFT JOIN locations l ON o.source_location_id = l.id
       WHERE o.type = 'delivery'
       ORDER BY o.created_at DESC LIMIT 5`
    );

    const categoriesRes = await db.query(`SELECT DISTINCT category FROM products ORDER BY category`);
    const categories = categoriesRes.rows.map((r) => r.category);

    return {
      kpis: {
        totalProducts,
        lowStockCount,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
      recentReceipts: recentReceiptsRes.rows,
      recentDeliveries: recentDeliveriesRes.rows,
      categories,
    };
  }
}

module.exports = new DashboardService();
