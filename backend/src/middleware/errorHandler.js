/**
 * Centralized error handler returning structured, meaningful error feedback.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details || null;

  // Handle PostgreSQL specific error codes
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this unique value (such as SKU, Code, or Email) already exists.';
    details = err.detail;
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced resource does not exist or is currently in use by another record.';
    details = err.detail;
  } else if (err.code === '22P02') {
    // Invalid text representation (e.g. invalid integer ID)
    statusCode = 400;
    code = 'INVALID_INPUT_SYNTAX';
    message = 'Invalid parameter or data type format provided in request.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = {
  AppError,
  errorHandler,
};
