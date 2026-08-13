const { body } = require('express-validator');

const createOrderValidator = [
  body('paintingId').isMongoId().withMessage('A valid paintingId is required.'),
  body('paymentMethod').isIn(['bank_transfer', 'upi']).withMessage('paymentMethod must be bank_transfer or upi.'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address line1 is required.'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required.'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required.'),
  body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required.'),
  body('shippingAddress.mobile').trim().notEmpty().withMessage('Contact mobile is required.'),
];

const rejectPaymentValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required.'),
];

const updateOrderStatusValidator = [
  body('status').isIn(['packed', 'shipped', 'delivered']).withMessage('Invalid status.'),
  body('trackingNote').optional().trim(),
];

module.exports = {
  createOrderValidator,
  rejectPaymentValidator,
  updateOrderStatusValidator,
};
