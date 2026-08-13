const { body, query } = require('express-validator');

const signupValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const verifyEmailValidator = [
  query('token').notEmpty().withMessage('Verification token is required.'),
];

const resendVerificationValidator = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

module.exports = {
  signupValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  changePasswordValidator,
};
