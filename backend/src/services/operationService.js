const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class OperationService {
  async generateReference(client, type) {
    const prefixMap = {
      receipt: 'IN',
      delivery: 'OUT',
      transfer: 'INT',
      adjustment: 'ADJ',
    };
    const code = prefixMap[type] || 'OP';

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS count FROM operations WHERE type = $1`,
      [type]
    );
    const nextNum = (countRes.rows[0].count || 0) + 1;
    const ref = `WH/${code}/${String(nextNum).padStart(4, '0')}`;

    const exists = await client.query('SELECT 1 FROM operations WHERE reference = $1', [ref]);
    if (exists.rows.length > 0) {
      return `WH/${code}/${String(nextNum + Math.floor(Math.random() * 100)).padStart(4, '0')}`;
    }
    return ref;
  }

  async getOperations({ type, status, warehouseId, locationId, search }) {
    let query = `
      SELECT 
        o.id,
        o.type,
        o.reference,
        o.scheduled_date,
        o.status,
        o.notes,
        o.created_at,
        p.id AS partner_id,
        p.name AS partner_name,
        sl.id AS source_location_id,
        sl.code AS source_location_code,
        dl.id AS dest_location_id,
        dl.code AS dest_location_code,
        u.name AS created_by_name,
        COUNT(ol.id)::int AS total_items
      FROM operations o
      LEFT JOIN partners p ON o.partner_id = p.id
      LEFT JOIN locations sl ON o.source_location_id = sl.id
      LEFT JOIN locations dl ON o.dest_location_id = dl.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN operation_lines ol ON o.id = ol.operation_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND o.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (warehouseId) {
      params.push(parseInt(warehouseId, 10));
      query += ` AND (sl.warehouse_id = $${params.length} OR dl.warehouse_id = $${params.length})`;
    }

    if (locationId) {
      params.push(parseInt(locationId, 10));
      query += ` AND (o.source_location_id = $${params.length} OR o.dest_location_id = $${params.length})`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (o.reference ILIKE $${params.length} OR p.name ILIKE $${params.length})`;
    }

    query += `
      GROUP BY o.id, p.id, sl.id, dl.id, u.id
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  async getOperationById(id) {
    const opRes = await db.query(
      `SELECT 
        o.id,
        o.type,
        o.reference,
        o.scheduled_date,
        o.status,
        o.notes,
        o.created_at,
        p.id AS partner_id,
        p.name AS partner_name,
        p.type AS partner_type,
        sl.id AS source_location_id,
        sl.code AS source_location_code,
        dl.id AS dest_location_id,
        dl.code AS dest_location_code,
        u.name AS created_by_name
       FROM operations o
       LEFT JOIN partners p ON o.partner_id = p.id
       LEFT JOIN locations sl ON o.source_location_id = sl.id
       LEFT JOIN locations dl ON o.dest_location_id = dl.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (opRes.rows.length === 0) {
      throw new AppError('Operation not found.', 404, 'NOT_FOUND');
    }

    const operation = opRes.rows[0];

    const linesRes = await db.query(
      `SELECT 
        ol.id,
        ol.product_id,
        ol.quantity,
        ol.counted_quantity,
        p.name AS product_name,
        p.sku AS product_sku,
        p.uom AS product_uom,
        COALESCE(sl.quantity, 0)::numeric AS current_source_stock
       FROM operation_lines ol
       JOIN products p ON ol.product_id = p.id
       LEFT JOIN stock_levels sl ON sl.product_id = ol.product_id AND sl.location_id = $2
       WHERE ol.operation_id = $1
       ORDER BY ol.id ASC`,
      [id, operation.source_location_id || operation.dest_location_id]
    );

    return {
      ...operation,
      lines: linesRes.rows,
    };
  }

  async createOperation({ type, partner_id, source_location_id, dest_location_id, scheduled_date, notes, lines, userId }) {
    if (!type || !['receipt', 'delivery', 'transfer', 'adjustment'].includes(type)) {
      throw new AppError('Valid operation type is required.', 400, 'INVALID_TYPE');
    }

    return db.withTransaction(async (client) => {
      const reference = await this.generateReference(client, type);
      const defaultStatus = type === 'delivery' ? 'Ready' : (type === 'adjustment' ? 'Draft' : 'Ready');

      const opRes = await client.query(
        `INSERT INTO operations (type, reference, partner_id, source_location_id, dest_location_id, scheduled_date, status, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          type,
          reference,
          partner_id || null,
          source_location_id || null,
          dest_location_id || null,
          scheduled_date || new Date(),
          defaultStatus,
          notes || '',
          userId || null,
        ]
      );
      const operation = opRes.rows[0];

      if (lines && Array.isArray(lines) && lines.length > 0) {
        for (const line of lines) {
          if (line.product_id) {
            await client.query(
              `INSERT INTO operation_lines (operation_id, product_id, quantity, counted_quantity)
               VALUES ($1, $2, $3, $4)`,
              [
                operation.id,
                line.product_id,
                parseFloat(line.quantity) || 1,
                line.counted_quantity !== undefined && line.counted_quantity !== null ? parseFloat(line.counted_quantity) : null,
              ]
            );
          }
        }
      }

      return operation;
    });
  }

  async updateOperation(id, { partner_id, source_location_id, dest_location_id, scheduled_date, notes, lines, status }) {
    return db.withTransaction(async (client) => {
      const existing = await client.query('SELECT status, type FROM operations WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        throw new AppError('Operation not found.', 404, 'NOT_FOUND');
      }

      if (['Done', 'Canceled'].includes(existing.rows[0].status)) {
        throw new AppError('Completed or canceled operations cannot be modified.', 400, 'OPERATION_LOCKED');
      }

      await client.query(
        `UPDATE operations 
         SET partner_id = COALESCE($1, partner_id),
             source_location_id = COALESCE($2, source_location_id),
             dest_location_id = COALESCE($3, dest_location_id),
             scheduled_date = COALESCE($4, scheduled_date),
             notes = COALESCE($5, notes),
             status = COALESCE($6, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [partner_id, source_location_id, dest_location_id, scheduled_date, notes, status, id]
      );

      if (lines && Array.isArray(lines)) {
        await client.query('DELETE FROM operation_lines WHERE operation_id = $1', [id]);
        for (const line of lines) {
          if (line.product_id) {
            await client.query(
              `INSERT INTO operation_lines (operation_id, product_id, quantity, counted_quantity)
               VALUES ($1, $2, $3, $4)`,
              [
                id,
                line.product_id,
                parseFloat(line.quantity) || 0,
                line.counted_quantity !== undefined && line.counted_quantity !== null ? parseFloat(line.counted_quantity) : null,
              ]
            );
          }
        }
      }

      const resOp = await client.query('SELECT * FROM operations WHERE id = $1', [id]);
      return resOp.rows[0];
    });
  }

  /**
   * Idempotent validation with FOR UPDATE row locking and missing-row handling
   */
  async validateOperation(id) {
    return db.withTransaction(async (client) => {
      // 1. Lock the operation row atomically
      const opRes = await client.query(
        `SELECT * FROM operations WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (opRes.rows.length === 0) {
        throw new AppError('Operation not found.', 404, 'NOT_FOUND');
      }

      const op = opRes.rows[0];

      // Fetch partner and location codes separately
      const metaRes = await client.query(
        `SELECT p.name AS partner_name, sl.code AS source_code, dl.code AS dest_code
         FROM operations o
         LEFT JOIN partners p ON o.partner_id = p.id
         LEFT JOIN locations sl ON o.source_location_id = sl.id
         LEFT JOIN locations dl ON o.dest_location_id = dl.id
         WHERE o.id = $1`,
        [id]
      );
      Object.assign(op, metaRes.rows[0] || {});

      // Idempotent Guard: If already Done, return safely without double-mutating stock
      if (op.status === 'Done') {
        return {
          id: op.id,
          reference: op.reference,
          status: 'Done',
          alreadyValidated: true,
          message: `Operation ${op.reference} is already validated (idempotent guard).`,
        };
      }

      if (op.status === 'Canceled') {
        throw new AppError('Cannot validate a canceled operation.', 400, 'OPERATION_CANCELED');
      }

      // Fetch operation lines
      const linesRes = await client.query(
        `SELECT ol.*, p.name AS product_name, p.uom, p.sku
         FROM operation_lines ol
         JOIN products p ON ol.product_id = p.id
         WHERE ol.operation_id = $1`,
        [id]
      );

      const lines = linesRes.rows;
      if (lines.length === 0) {
        throw new AppError('Cannot validate an operation with no products added.', 400, 'EMPTY_OPERATION');
      }

      // 2. Execute movement based on type
      if (op.type === 'receipt') {
        if (!op.dest_location_id) {
          throw new AppError('Destination location is required for incoming receipts.', 400, 'MISSING_LOCATION');
        }

        for (const line of lines) {
          const qty = parseFloat(line.quantity);
          if (qty <= 0) continue;

          // Missing-row handling for incoming stock: insert or increment
          await client.query(
            `INSERT INTO stock_levels (product_id, location_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, location_id)
             DO UPDATE SET quantity = stock_levels.quantity + $3`,
            [line.product_id, op.dest_location_id, qty]
          );

          // Immutable Ledger Entry (with product_id foreign key)
          await client.query(
            `INSERT INTO stock_moves (operation_id, reference, date, operation_type, from_location, to_location, product_id, quantity, status)
             VALUES ($1, $2, CURRENT_DATE, 'Receipt', $3, $4, $5, $6, 'Done')`,
            [
              op.id,
              op.reference,
              op.partner_name || 'Vendor',
              op.dest_code || 'WH/Stock',
              line.product_id,
              qty,
            ]
          );
        }
      } else if (op.type === 'delivery') {
        if (!op.source_location_id) {
          throw new AppError('Source location is required for delivery orders.', 400, 'MISSING_LOCATION');
        }

        for (const line of lines) {
          const qty = parseFloat(line.quantity);
          if (qty <= 0) continue;

          // Missing-row handling with FOR UPDATE lock:
          const stockRes = await client.query(
            `SELECT quantity FROM stock_levels 
             WHERE product_id = $1 AND location_id = $2 
             FOR UPDATE`,
            [line.product_id, op.source_location_id]
          );

          const availableStock = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].quantity) : 0;
          if (availableStock < qty) {
            throw new AppError(
              `Insufficient stock for "${line.product_name}". Available at ${op.source_code}: ${availableStock} ${line.uom}, Requested: ${qty} ${line.uom}.`,
              422,
              'INSUFFICIENT_STOCK',
              {
                productId: line.product_id,
                productName: line.product_name,
                available: availableStock,
                requested: qty,
              }
            );
          }

          // Deduct stock safely
          await client.query(
            `UPDATE stock_levels 
             SET quantity = quantity - $3
             WHERE product_id = $1 AND location_id = $2`,
            [line.product_id, op.source_location_id, qty]
          );

          // Immutable Ledger Entry (with product_id FK)
          await client.query(
            `INSERT INTO stock_moves (operation_id, reference, date, operation_type, from_location, to_location, product_id, quantity, status)
             VALUES ($1, $2, CURRENT_DATE, 'Delivery Order', $3, $4, $5, $6, 'Done')`,
            [
              op.id,
              op.reference,
              op.source_code || 'WH/Stock',
              op.partner_name || 'Customer',
              line.product_id,
              -qty,
            ]
          );
        }
      } else if (op.type === 'transfer') {
        if (!op.source_location_id || !op.dest_location_id) {
          throw new AppError('Both source and destination locations are required.', 400, 'MISSING_LOCATION');
        }
        if (op.source_location_id === op.dest_location_id) {
          throw new AppError('Source and destination locations cannot be identical.', 400, 'SAME_LOCATION');
        }

        for (const line of lines) {
          const qty = parseFloat(line.quantity);
          if (qty <= 0) continue;

          // Missing-row handling with FOR UPDATE on source
          const stockRes = await client.query(
            `SELECT quantity FROM stock_levels 
             WHERE product_id = $1 AND location_id = $2 
             FOR UPDATE`,
            [line.product_id, op.source_location_id]
          );

          const availableStock = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].quantity) : 0;
          if (availableStock < qty) {
            throw new AppError(
              `Cannot transfer: Insufficient stock for "${line.product_name}" at ${op.source_code}. Available: ${availableStock}, Requested: ${qty}.`,
              422,
              'INSUFFICIENT_STOCK'
            );
          }

          // Deduct from source
          await client.query(
            `UPDATE stock_levels 
             SET quantity = quantity - $3
             WHERE product_id = $1 AND location_id = $2`,
            [line.product_id, op.source_location_id, qty]
          );

          // Add to destination with missing-row handling (UPSERT)
          await client.query(
            `INSERT INTO stock_levels (product_id, location_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, location_id)
             DO UPDATE SET quantity = stock_levels.quantity + $3`,
            [line.product_id, op.dest_location_id, qty]
          );

          // Immutable Ledger Entry
          await client.query(
            `INSERT INTO stock_moves (operation_id, reference, date, operation_type, from_location, to_location, product_id, quantity, status)
             VALUES ($1, $2, CURRENT_DATE, 'Internal Transfer', $3, $4, $5, $6, 'Done')`,
            [op.id, op.reference, op.source_code, op.dest_code, line.product_id, qty]
          );
        }
      } else if (op.type === 'adjustment') {
        const locId = op.source_location_id || op.dest_location_id;
        if (!locId) {
          throw new AppError('A location is required for inventory adjustment.', 400, 'MISSING_LOCATION');
        }

        const locRes = await client.query('SELECT code FROM locations WHERE id = $1', [locId]);
        const locCode = locRes.rows[0] ? locRes.rows[0].code : 'WH/Stock';

        for (const line of lines) {
          const counted = parseFloat(line.counted_quantity !== null && line.counted_quantity !== undefined ? line.counted_quantity : line.quantity);

          const currentRes = await client.query(
            `SELECT quantity FROM stock_levels WHERE product_id = $1 AND location_id = $2 FOR UPDATE`,
            [line.product_id, locId]
          );
          const recorded = currentRes.rows.length > 0 ? parseFloat(currentRes.rows[0].quantity) : 0;
          const diff = counted - recorded;

          if (diff !== 0) {
            // Upsert counted stock level
            await client.query(
              `INSERT INTO stock_levels (product_id, location_id, quantity)
               VALUES ($1, $2, $3)
               ON CONFLICT (product_id, location_id)
               DO UPDATE SET quantity = $3`,
              [line.product_id, locId, counted]
            );

            // Immutable Ledger Entry
            await client.query(
              `INSERT INTO stock_moves (operation_id, reference, date, operation_type, from_location, to_location, product_id, quantity, status)
               VALUES ($1, $2, CURRENT_DATE, 'Adjustment', $3, $3, $4, $5, 'Done')`,
              [op.id, op.reference, locCode, line.product_id, diff]
            );
          }
        }
      }

      // Mark operation status Done atomically
      await client.query(
        `UPDATE operations SET status = 'Done', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      return {
        id: op.id,
        reference: op.reference,
        status: 'Done',
        alreadyValidated: false,
      };
    });
  }

  async cancelOperation(id) {
    const opRes = await db.query('SELECT status, reference FROM operations WHERE id = $1', [id]);
    if (opRes.rows.length === 0) {
      throw new AppError('Operation not found.', 404, 'NOT_FOUND');
    }

    if (opRes.rows[0].status === 'Done') {
      throw new AppError('Validated operations cannot be canceled directly. Create a reversal adjustment instead.', 400, 'OPERATION_DONE');
    }

    await db.query(
      `UPDATE operations SET status = 'Canceled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    return { reference: opRes.rows[0].reference };
  }
}

module.exports = new OperationService();
