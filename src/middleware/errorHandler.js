/**
 * Custom error class for expected/operational errors (bad input, not
 * found, forbidden, etc). Controllers throw these and the global
 * handler below knows to trust their status code + message.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/** 404 handler for unmatched routes — placed after all routes in app.js. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler. Distinguishes known operational errors (thrown
 * as ApiError, or express-validator/mongoose validation issues) from
 * unexpected bugs: the former return their specific status + message,
 * the latter are logged in full server-side and return a generic 500
 * so we never leak stack traces or internals to clients.
 */
function errorHandler(err, req, res, next) {
  // Known, intentional errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ errors });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already in use.` });
  }

  // Multer errors (file too large, bad type, etc)
  if (err.name === 'MulterError' || /image/i.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }

  // Unexpected error: log full detail, return generic message
  console.error('[error]', err);
  return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
}

module.exports = { ApiError, notFound, errorHandler };
