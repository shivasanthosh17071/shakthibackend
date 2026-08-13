const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, verifyEmail, resendVerification, login } = require('../controllers/authController');
const {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');

const router = express.Router();

// Slows credential stuffing / spam signups across all auth routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

router.use(authLimiter);

router.post('/signup', signupValidator, validate, signup);
router.get('/verify-email', verifyEmailValidator, validate, verifyEmail);
router.post('/resend-verification', resendVerificationValidator, validate, resendVerification);
router.post('/login', loginValidator, validate, login);

module.exports = router;
