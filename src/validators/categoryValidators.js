const { body } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('image').optional().isURL(),
];

const updateCategoryValidator = [
  body('name').optional().trim().notEmpty(),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('image').optional().isURL(),
];

module.exports = { createCategoryValidator, updateCategoryValidator };
