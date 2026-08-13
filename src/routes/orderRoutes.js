const express = require('express');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { createOrder, submitPaymentProof, listMyOrders, getOrder } = require('../controllers/orderController');
const { createOrderValidator } = require('../validators/orderValidators');
const validate = require('../middleware/validate');

const router = express.Router();

// All order routes require an authenticated buyer (or, for GET /:id,
// any authenticated user — ownership is checked inside the controller).
router.post('/', auth, role(['buyer']), createOrderValidator, validate, createOrder);
router.post('/:id/payment-proof', auth, role(['buyer']), submitPaymentProof);
router.get('/my', auth, role(['buyer']), listMyOrders);
router.get('/:id', auth, getOrder); // buyer owner, seller owner, or admin — enforced in controller

module.exports = router;
