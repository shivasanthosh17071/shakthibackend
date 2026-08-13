const slugify = require('slugify');
const Category = require('../models/Category');
const { ApiError } = require('../middleware/errorHandler');

/** GET /api/categories — public */
async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/categories */
async function createCategory(req, res, next) {
  try {
    const { name, description, image } = req.body;
    const slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(name, { lower: true });

    const category = await Category.create({ name, slug, description, image });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/categories/:id */
async function updateCategory(req, res, next) {
  try {
    const { name, description, image } = req.body;
    const update = { name, description, image };

    if (req.body.slug) {
      update.slug = slugify(req.body.slug, { lower: true });
    } else if (name) {
      update.slug = slugify(name, { lower: true });
    }

    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!category) throw new ApiError(404, 'Category not found.');

    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/categories/:id */
async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw new ApiError(404, 'Category not found.');
    res.status(200).json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
