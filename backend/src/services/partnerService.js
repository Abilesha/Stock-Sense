const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class PartnerService {
  async getPartners(type) {
    let query = 'SELECT * FROM partners';
    const params = [];

    if (type) {
      params.push(type);
      query += ' WHERE type = $1';
    }

    query += ' ORDER BY name ASC';
    const result = await db.query(query, params);
    return result.rows;
  }

  async createPartner({ name, type, email, phone, address }) {
    if (!name || !type || !['vendor', 'customer'].includes(type)) {
      throw new AppError('Partner name and valid type (vendor/customer) are required.', 400, 'MISSING_FIELDS');
    }

    const result = await db.query(
      `INSERT INTO partners (name, type, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), type, email ? email.trim() : null, phone ? phone.trim() : null, address ? address.trim() : null]
    );

    return result.rows[0];
  }
}

module.exports = new PartnerService();
