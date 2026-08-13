const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, verifyEmail, resendVerification, login, changePassword } = require('../controllers/authController');
const {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  changePasswordValidator,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

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
router.put('/change-password', auth, changePasswordValidator, validate, changePassword);

module.exports = router;
