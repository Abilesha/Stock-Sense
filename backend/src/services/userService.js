const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');

class UserService {
  async getAllUsers() {
    const res = await db.query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY id ASC`
    );
    return res.rows;
  }

  async createUser({ name, email, password, role }) {
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS');
    }

    const assignedRole = role && ['manager', 'staff', 'admin'].includes(role) ? role : 'staff';
    const emailTrimmed = email.trim().toLowerCase();

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [emailTrimmed]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), emailTrimmed, passwordHash, assignedRole]
    );

    return res.rows[0];
  }

  async updateUserRole(id, role) {
    if (!['manager', 'staff', 'admin'].includes(role)) {
      throw new AppError('Invalid role specified.', 400, 'INVALID_ROLE');
    }

    const res = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at`,
      [role, id]
    );

    if (res.rows.length === 0) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return res.rows[0];
  }
}

module.exports = new UserService();
