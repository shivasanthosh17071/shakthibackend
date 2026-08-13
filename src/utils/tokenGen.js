const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/** Signs a JWT for an authenticated user. */
function signAuthToken({ userId, role, sellerStatus }) {
  return jwt.sign(
    { userId, role, sellerStatus },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Verifies and decodes a JWT. Throws if invalid/expired. */
function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Generates a random verification token pair for flows like email
 * verification: the raw token is emailed to the user (never stored),
 * and only its SHA-256 hash is persisted in the DB. This means a DB
 * leak alone can't be used to forge a valid verification link.
 */
function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  generateVerificationToken,
  hashToken,
};
