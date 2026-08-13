const express = require('express');
const auth = require('../middleware/auth');
const sellerApproved = require('../middleware/sellerApproved');
const validate = require('../middleware/validate');

const { applyAsSeller, getSellerStatus, updateSellerProfile } = require('../controllers/sellerController');
const { sellerApplyValidator, sellerUpdateProfileValidator } = require('../validators/sellerValidators');

const {
  listMyPaintings,
  createPainting,
  updatePainting,
  deletePainting,
} = require('../controllers/paintingController');
const { createPaintingValidator, updatePaintingValidator } = require('../validators/paintingValidators');

const {
  listSellerOrders,
  verifyPayment,
  rejectPayment,
  updateOrderStatus,
} = require('../controllers/orderController');
const { rejectPaymentValidator, updateOrderStatusValidator } = require('../validators/orderValidators');

const router = express.Router();

// --- Onboarding: open to any verified user, not yet an approved seller ---
router.post('/apply', auth, sellerApplyValidator, validate, applyAsSeller);
router.get('/status', auth, getSellerStatus);

// --- Everything below requires role='seller' && sellerStatus='approved' ---
router.put('/profile', auth, sellerApproved, sellerUpdateProfileValidator, validate, updateSellerProfile);
router.get('/paintings', auth, sellerApproved, listMyPaintings);
router.post('/paintings', auth, sellerApproved, createPaintingValidator, validate, createPainting);
router.put('/paintings/:id', auth, sellerApproved, updatePaintingValidator, validate, updatePainting);
router.delete('/paintings/:id', auth, sellerApproved, deletePainting);

router.get('/orders', auth, sellerApproved, listSellerOrders);
router.put('/orders/:id/verify-payment', auth, sellerApproved, verifyPayment);
router.put('/orders/:id/reject-payment', auth, sellerApproved, rejectPaymentValidator, validate, rejectPayment);
router.put('/orders/:id/status', auth, sellerApproved, updateOrderStatusValidator, validate, updateOrderStatus);

module.exports = router;
