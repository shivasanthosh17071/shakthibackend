const express = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const validate = require('../middleware/validate');

const {
  listPendingSellers,
  approveSeller,
  rejectSeller,
  listUsers,
  listAllPaintings,
  listAllOrders,
} = require('../controllers/adminController');
const { sellerRejectValidator } = require('../validators/sellerValidators');

const { createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { createCategoryValidator, updateCategoryValidator } = require('../validators/categoryValidators');

const router = express.Router();

// Every route here is admin-only.
router.use(auth, role(['admin']));

router.get('/sellers/pending', listPendingSellers);
router.put('/sellers/:id/approve', approveSeller);
router.put('/sellers/:id/reject', sellerRejectValidator, validate, rejectSeller);

router.get('/users', listUsers);
router.get('/paintings', listAllPaintings);
router.get('/orders', listAllOrders);

router.post('/categories', createCategoryValidator, validate, createCategory);
router.put('/categories/:id', updateCategoryValidator, validate, updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
