const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { sendMail } = require('../config/mailer');
const {
  sellerApplicationReceivedTemplate,
  sellerApplicationAdminNotifyTemplate,
} = require('../utils/emailTemplates');

/**
 * POST /api/seller/apply (auth: any verified user)
 * Sets sellerStatus='pending' only — role stays 'buyer' until an admin
 * approves, so the applicant's existing buyer permissions/orders are
 * completely unaffected while their application is under review.
 */
async function applyAsSeller(req, res, next) {
  try {
    if (req.user.sellerStatus === 'pending') {
      throw new ApiError(400, 'You already have a pending seller application.');
    }
    if (req.user.sellerStatus === 'approved') {
      throw new ApiError(400, 'You are already an approved seller.');
    }

    const { sellerBio, mobile, portfolioLinks, sampleWorkImages } = req.body;

    req.user.sellerBio = sellerBio;
    req.user.mobile = mobile || req.user.mobile;
    req.user.portfolioLinks = portfolioLinks || [];
    req.user.sampleWorkImages = sampleWorkImages;
    req.user.sellerStatus = 'pending';
    req.user.rejectionReason = undefined;
    await req.user.save();

    const { subject, html } = sellerApplicationReceivedTemplate({ name: req.user.name });
    await sendMail({ to: req.user.email, subject, html });

    if (process.env.ADMIN_NOTIFY_EMAIL) {
      const adminEmail = sellerApplicationAdminNotifyTemplate({
        applicantName: req.user.name,
        applicantEmail: req.user.email,
      });
      await sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: adminEmail.subject, html: adminEmail.html });
    }

    res.status(200).json({
      message: 'Application submitted. We will review it and email you with a decision.',
      sellerStatus: req.user.sellerStatus,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/seller/status (auth: any verified user) */
async function getSellerStatus(req, res, next) {
  try {
    res.status(200).json({
      sellerStatus: req.user.sellerStatus,
      rejectionReason: req.user.rejectionReason || null,
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/seller/profile (auth: approved seller) */
async function updateSellerProfile(req, res, next) {
  try {
    const { sellerBio, mobile, portfolioLinks, sellerProfileImage, pickupAddress } = req.body;

    req.user.sellerBio = sellerBio;
    req.user.mobile = mobile;
    req.user.portfolioLinks = portfolioLinks || [];
    if (sellerProfileImage !== undefined) req.user.sellerProfileImage = sellerProfileImage;
    if (pickupAddress !== undefined) req.user.pickupAddress = pickupAddress;
    await req.user.save();

    res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { applyAsSeller, getSellerStatus, updateSellerProfile };
