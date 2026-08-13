const { validationResult } = require('express-validator');

/**
 * Runs after an express-validator chain. Returns a structured 422 with
 * every failing field so the frontend can highlight them individually.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
