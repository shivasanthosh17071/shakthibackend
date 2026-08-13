const Order = require('../models/Order');
const Painting = require('../models/Painting');
const { ApiError } = require('../middleware/errorHandler');
const { pushStatusHistory } = require('../utils/statusHistory');
const { sendMail } = require('../config/mailer');
const {
  orderPlacedTemplate,
  paymentProofSubmittedTemplate,
  paymentVerifiedTemplate,
  paymentRejectedTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
} = require('../utils/emailTemplates');

const ORDER_URL = (id) => `${process.env.CLIENT_URL}/orders/${id}`;
const FORWARD_FULFILLMENT_STEPS = ['confirmed', 'packed', 'shipped', 'delivered'];

/**
 * POST /api/orders (buyer)
 *
 * Deliberately does NOT mark the painting 'sold' at order-creation time.
 * Reserving stock the instant a checkout starts would let an abandoned
 * or never-paid order permanently lock a painting out of the catalog.
 * Instead the painting stays 'active' until payment is actually
 * verified by the seller (see verifyPayment below). The tradeoff is
 * that two buyers could theoretically both start checkout on the same
 * painting before one pays — acceptable for a low-volume art
 * marketplace, and resolvable by the seller simply rejecting/refunding
 * the second payment if it arrives. A scheduled job could later expire
 * stale unpaid orders (e.g. auto-cancel orders with paymentStatus
 * 'pending' after 48h) if this needs tightening.
 */
async function createOrder(req, res, next) {
  try {
    const { paintingId, shippingAddress, paymentMethod } = req.body;

    const painting = await Painting.findById(paintingId).populate('sellerId', 'email name');
    if (!painting) throw new ApiError(404, 'Painting not found.');
    if (painting.status !== 'active') {
      throw new ApiError(400, 'This painting is no longer available for purchase.');
    }

    const order = await Order.create({
      buyerId: req.user._id,
      paintingId: painting._id,
      sellerId: painting.sellerId._id,
      amount: painting.price,
      shippingAddress,
      paymentMethod,
      orderStatus: 'placed',
      paymentStatus: 'pending',
      statusHistory: [{ status: 'placed', timestamp: new Date() }],
    });

    const { subject, html } = orderPlacedTemplate({
      name: req.user.name,
      paintingTitle: painting.title,
      amount: order.amount,
      orderUrl: ORDER_URL(order._id),
    });
    await sendMail({ to: req.user.email, subject, html });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

/** POST /api/orders/:id/payment-proof (buyer, must own the order) */
async function submitPaymentProof(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyerId: req.user._id })
      .populate('paintingId', 'title')
      .populate('sellerId', 'email name');

    if (!order) throw new ApiError(404, 'Order not found.');

    const { paymentProofUrl } = req.body;
    if (!paymentProofUrl) throw new ApiError(400, 'paymentProofUrl is required.');

    order.paymentProofUrl = paymentProofUrl;
    order.paymentStatus = 'submitted';
    order.orderStatus = 'payment_review';
    pushStatusHistory(order, 'payment_review', 'Payment proof submitted by buyer.');
    await order.save();

    const { subject, html } = paymentProofSubmittedTemplate({
      sellerName: order.sellerId.name,
      paintingTitle: order.paintingId.title,
      orderUrl: ORDER_URL(order._id),
    });
    await sendMail({ to: order.sellerId.email, subject, html });

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/seller/orders/:id/verify-payment (seller, must own the order) */
async function verifyPayment(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user._id })
      .populate('paintingId')
      .populate('buyerId', 'email name');

    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.paymentStatus !== 'submitted') {
      throw new ApiError(400, 'Only submitted payments can be verified.');
    }

    order.paymentStatus = 'verified';
    order.orderStatus = 'confirmed'; // transitions in the same request, no separate status call needed
    pushStatusHistory(order, 'confirmed', 'Payment verified by seller.');
    await order.save();

    order.paintingId.status = 'sold';
    await order.paintingId.save();

    const { subject, html } = paymentVerifiedTemplate({
      name: order.buyerId.name,
      paintingTitle: order.paintingId.title,
      orderUrl: ORDER_URL(order._id),
    });
    await sendMail({ to: order.buyerId.email, subject, html });

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/seller/orders/:id/reject-payment (seller, must own the order) */
async function rejectPayment(req, res, next) {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user._id })
      .populate('paintingId', 'title')
      .populate('buyerId', 'email name');

    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.paymentStatus !== 'submitted') {
      throw new ApiError(400, 'Only submitted payments can be rejected.');
    }

    order.paymentStatus = 'rejected';
    order.orderStatus = 'payment_review'; // stays in review; frontend prompts buyer to resubmit
    order.rejectionNote = reason;
    pushStatusHistory(order, 'payment_review', `Payment rejected: ${reason}`);
    await order.save();

    const { subject, html } = paymentRejectedTemplate({
      name: order.buyerId.name,
      paintingTitle: order.paintingId.title,
      reason,
      orderUrl: ORDER_URL(order._id),
    });
    await sendMail({ to: order.buyerId.email, subject, html });

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/seller/orders/:id/status (seller, must own the order)
 * Enforces strictly forward-only fulfillment transitions:
 *   confirmed -> packed -> shipped -> delivered
 * Rejects any out-of-order jump (e.g. confirmed -> delivered, or
 * shipped -> packed) with 400.
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { status, trackingNote } = req.body;

    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user._id })
      .populate('paintingId', 'title')
      .populate('buyerId', 'email name');

    if (!order) throw new ApiError(404, 'Order not found.');

    const currentIndex = FORWARD_FULFILLMENT_STEPS.indexOf(order.orderStatus);
    const targetIndex = FORWARD_FULFILLMENT_STEPS.indexOf(status);

    if (currentIndex === -1) {
      throw new ApiError(400, `Order must be confirmed before it can be updated (currently '${order.orderStatus}').`);
    }
    if (targetIndex !== currentIndex + 1) {
      throw new ApiError(400, `Cannot move order from '${order.orderStatus}' directly to '${status}'. Transitions must be sequential.`);
    }

    order.orderStatus = status;
    if (trackingNote) order.trackingNote = trackingNote;
    pushStatusHistory(order, status, trackingNote);
    await order.save();

    let emailPayload;
    if (status === 'shipped') {
      emailPayload = orderShippedTemplate({
        name: order.buyerId.name,
        paintingTitle: order.paintingId.title,
        trackingNote: order.trackingNote,
        orderUrl: ORDER_URL(order._id),
      });
    } else if (status === 'delivered') {
      emailPayload = orderDeliveredTemplate({
        name: order.buyerId.name,
        paintingTitle: order.paintingId.title,
        orderUrl: ORDER_URL(order._id),
      });
    }

    if (emailPayload) {
      await sendMail({ to: order.buyerId.email, subject: emailPayload.subject, html: emailPayload.html });
    }

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/my (buyer) */
async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate('paintingId', 'title images price')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/:id (buyer owner OR seller owner OR admin) */
async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('paintingId')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!order) throw new ApiError(404, 'Order not found.');

    const isOwner =
      order.buyerId._id.toString() === req.user._id.toString() ||
      order.sellerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'You do not have permission to view this order.');
    }

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

/** GET /api/seller/orders (seller), filterable by ?status= */
async function listSellerOrders(req, res, next) {
  try {
    const filter = { sellerId: req.user._id };
    if (req.query.status) filter.orderStatus = req.query.status;

    const orders = await Order.find(filter)
      .populate('paintingId', 'title images price')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  updateOrderStatus,
  listMyOrders,
  getOrder,
  listSellerOrders,
};
