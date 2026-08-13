const { body } = require('express-validator');

const subscribeValidator = [
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
];

module.exports = { subscribeValidator };
