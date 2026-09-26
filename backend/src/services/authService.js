const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'stocksense_super_secure_secret_key_2026_change_in_production';

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  async signup({ name, email, password }) {
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS');
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [emailTrimmed]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'manager')
       RETURNING id, name, email, role, created_at`,
      [name.trim(), emailTrimmed, passwordHash]
    );

    const user = result.rows[0];
    const token = this.generateToken(user);
    return { user, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400, 'MISSING_FIELDS');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const result = await db.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [emailTrimmed]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    };
  }

  /**
   * Generates a 6-digit OTP, stores a cryptographically secure hash in password_resets(user_id, otp_hash)
   */
  async forgotPassword(email) {
    if (!email) {
      throw new AppError('Email address is required.', 400, 'MISSING_EMAIL');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const userRes = await db.query('SELECT id, name FROM users WHERE email = $1', [emailTrimmed]);
    if (userRes.rows.length === 0) {
      throw new AppError('No account found with this email address.', 404, 'USER_NOT_FOUND');
    }

    const userId = userRes.rows[0].id;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Invalidate prior unused OTPs for this user
    await db.query('UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE', [userId]);

    await db.query(
      `INSERT INTO password_resets (user_id, otp_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, otpHash, expiresAt]
    );

    console.log(`[Secure Hashed OTP Generated for User #${userId} (${emailTrimmed})]: ${otp}`);

    return {
      userId,
      email: emailTrimmed,
      otp, // returned for demonstration in test/development environments
      expiresInMinutes: 15,
    };
  }

  /**
   * Verifies hashed OTP against password_resets and updates password
   */
  async resetPassword({ email, otp, newPassword }) {
    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP code, and new password are required.', 400, 'MISSING_FIELDS');
    }
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [emailTrimmed]);
    if (userRes.rows.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }
    const userId = userRes.rows[0].id;

    // Fetch latest active reset token for user_id
    const resetRes = await db.query(
      `SELECT id, otp_hash, expires_at, used 
       FROM password_resets 
       WHERE user_id = $1 AND used = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (resetRes.rows.length === 0) {
      throw new AppError('No active password reset request found. Please request a new OTP.', 400, 'NO_ACTIVE_OTP');
    }

    const resetRecord = resetRes.rows[0];
    if (new Date() > new Date(resetRecord.expires_at)) {
      throw new AppError('This OTP code has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    // Verify hashed OTP
    const isOtpValid = await bcrypt.compare(otp.trim(), resetRecord.otp_hash);
    if (!isOtpValid) {
      throw new AppError('Invalid OTP code. Please check and try again.', 400, 'INVALID_OTP');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.withTransaction(async (client) => {
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
      await client.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetRecord.id]);
    });

    return { success: true };
  }

  async getMe(userId) {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }
    return result.rows[0];
  }
}

module.exports = new AuthService();
