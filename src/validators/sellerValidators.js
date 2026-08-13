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
];

module.exports = { sellerApplyValidator, sellerRejectValidator, sellerUpdateProfileValidator };
