const User = require('../models/User');
const Painting = require('../models/Painting');
const Order = require('../models/Order');
const { ApiError } = require('../middleware/errorHandler');
const { sendMail } = require('../config/mailer');
const { sellerApprovedTemplate, sellerRejectedTemplate } = require('../utils/emailTemplates');

/** GET /api/admin/sellers/pending */
async function listPendingSellers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const [sellers, total] = await Promise.all([
      User.find({ sellerStatus: 'pending' })
        .select('name email mobile sellerBio portfolioLinks sampleWorkImages createdAt')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments({ sellerStatus: 'pending' }),
    ]);

    res.status(200).json({ sellers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/sellers/:id/approve */
async function approveSeller(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.sellerStatus !== 'pending') {
      throw new ApiError(400, `Cannot approve a user whose seller status is '${user.sellerStatus}'.`);
    }

    user.role = 'seller';
    user.sellerStatus = 'approved';
    user.rejectionReason = undefined;
    await user.save();

    const { subject, html } = sellerApprovedTemplate({
      name: user.name,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    });
    await sendMail({ to: user.email, subject, html });

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/sellers/:id/reject */
async function rejectSeller(req, res, next) {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.sellerStatus !== 'pending') {
      throw new ApiError(400, `Cannot reject a user whose seller status is '${user.sellerStatus}'.`);
    }

    user.sellerStatus = 'rejected';
    user.rejectionReason = reason;
    await user.save();

    const { subject, html } = sellerRejectedTemplate({ name: user.name, reason });
    await sendMail({ to: user.email, subject, html });

    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users — paginated, filterable by role */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/paintings — paginated, filterable by status */
async function listAllPaintings(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [paintings, total] = await Promise.all([
      Painting.find(filter)
        .populate('category', 'name slug')
        .populate('sellerId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Painting.countDocuments(filter),
    ]);

    res.status(200).json({ paintings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/orders — paginated, filterable by status */
async function listAllOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('paintingId', 'title images price')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPendingSellers,
  approveSeller,
  rejectSeller,
  listUsers,
  listAllPaintings,
  listAllOrders,
};
