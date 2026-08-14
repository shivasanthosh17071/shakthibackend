const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAuthToken, generateVerificationToken, hashToken } = require('../utils/tokenGen');
const { sendMail } = require('../config/mailer');
const { verifyEmailTemplate } = require('../utils/emailTemplates');
const { ApiError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * POST /api/auth/signup
 * Duplicate-email responses ARE specific here (unlike login/resend) —
 * that's an accepted tradeoff for this app since signup email
 * enumeration isn't considered security-sensitive for a public art
 * marketplace, and a clear "already registered" message is better UX.
 */
async function signup(req, res, next) {
  try {
    const { name, email, password, mobile } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rawToken, hashedToken } = generateVerificationToken();

    const user = await User.create({
      name,
      email,
      passwordHash,
      mobile,
      isEmailVerified: false,
      emailVerifyToken: hashedToken,
      emailVerifyExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    const { subject, html } = verifyEmailTemplate({ name: user.name, verifyUrl });
    await sendMail({ to: user.email, subject, html });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/verify-email?token= */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      throw new ApiError(400, 'This verification link is invalid or has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-verification
 * Always responds with the same generic message regardless of whether
 * the email exists or is already verified, to avoid leaking account
 * existence (email enumeration) via this endpoint.
 */
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const GENERIC_MESSAGE = { message: 'If an account with that email exists and is unverified, a new verification email has been sent.' };

    const user = await User.findOne({ email });
    if (!user || user.isEmailVerified) {
      return res.status(200).json(GENERIC_MESSAGE);
    }

    const { rawToken, hashedToken } = generateVerificationToken();
    user.emailVerifyToken = hashedToken;
    user.emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    const { subject, html } = verifyEmailTemplate({ name: user.name, verifyUrl });
    await sendMail({ to: user.email, subject, html });

    res.status(200).json(GENERIC_MESSAGE);
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Please verify your email before logging in. Check your inbox for the verification link.');
    }

    if (user.blocked) {
      throw new ApiError(403, `Your account has been blocked.${user.blockReason ? ` Reason: ${user.blockReason}` : ''}`);
    }

    const token = signAuthToken({
      userId: user._id,
      role: user.role,
      sellerStatus: user.sellerStatus,
    });

    res.status(200).json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/auth/change-password (any authenticated role) */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, verifyEmail, resendVerification, login, changePassword };
