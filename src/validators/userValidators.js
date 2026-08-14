const { body } = require('express-validator');

const updateMeValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('mobile').optional().trim().notEmpty().withMessage('Mobile cannot be empty.'),
  body('address').optional().isObject().withMessage('Address must be an object.'),
  body('address.name').optional().trim().notEmpty().withMessage('Recipient name is required.'),
  body('address.line1').optional().trim().notEmpty().withMessage('Address line 1 is required.'),
  body('address.city').optional().trim().notEmpty().withMessage('City is required.'),
  body('address.state').optional().trim().notEmpty().withMessage('State is required.'),
  body('address.pincode').optional().trim().notEmpty().withMessage('Pincode is required.'),
  body('address.mobile').optional().trim().notEmpty().withMessage('Mobile is required.'),
];

module.exports = { updateMeValidator };
