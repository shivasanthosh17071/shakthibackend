const { body, query } = require('express-validator');

const createPaintingValidator = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('category').isMongoId().withMessage('A valid category is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('images')
    .isArray({ min: 1, max: 6 })
    .withMessage('Provide between 1 and 6 images.'),
  body('images.*').isURL().withMessage('Each image must be a valid URL.'),
  body('medium').optional().trim(),
  body('dimensions').optional().trim(),
  body('yearCreated').optional().isInt({ min: 1000, max: 3000 }),
];

const updatePaintingValidator = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('category').optional().isMongoId(),
  body('price').optional().isFloat({ min: 0 }),
  body('images').optional().isArray({ min: 1, max: 6 }),
  body('images.*').optional().isURL(),
  body('status').optional().isIn(['draft', 'active', 'sold', 'removed']),
];

const listPaintingsValidator = [
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createPaintingValidator,
  updatePaintingValidator,
  listPaintingsValidator,
};
