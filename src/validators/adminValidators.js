const { body } = require('express-validator');

const blockReasonValidator = [
  body('reason').trim().notEmpty().withMessage('A reason is required.'),
];

module.exports = { blockReasonValidator };
