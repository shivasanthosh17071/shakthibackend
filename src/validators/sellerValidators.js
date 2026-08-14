const { body } = require('express-validator');

const sellerApplyValidator = [
  body('sellerBio').trim().notEmpty().withMessage('A short bio is required.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('portfolioLinks').optional().isArray(),
  body('portfolioLinks.*').optional().isURL().withMessage('Each portfolio link must be a valid URL.'),
  body('sampleWorkImages')
    .isArray({ min: 1 })
    .withMessage('At least one sample work image is required.'),
  body('sampleWorkImages.*').isURL().withMessage('Each sample image must be a valid URL.'),
];

const sellerRejectValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required.'),
];

const sellerUpdateProfileValidator = [
  body('sellerBio').trim().notEmpty().withMessage('A short bio is required.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('portfolioLinks').optional().isArray(),
  body('portfolioLinks.*').optional().isURL().withMessage('Each portfolio link must be a valid URL.'),
  body('sellerProfileImage').optional().isURL().withMessage('Profile image must be a valid URL.'),
  body('pickupAddress').optional().isObject().withMessage('Pickup address must be an object.'),
  body('pickupAddress.name').optional().trim().notEmpty().withMessage('Contact name is required.'),
  body('pickupAddress.line1').optional().trim().notEmpty().withMessage('Address line 1 is required.'),
  body('pickupAddress.city').optional().trim().notEmpty().withMessage('City is required.'),
  body('pickupAddress.state').optional().trim().notEmpty().withMessage('State is required.'),
  body('pickupAddress.pincode').optional().trim().notEmpty().withMessage('Pincode is required.'),
  body('pickupAddress.mobile').optional().trim().notEmpty().withMessage('Mobile is required.'),
];

module.exports = { sellerApplyValidator, sellerRejectValidator, sellerUpdateProfileValidator };
