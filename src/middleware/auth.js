const { verifyAuthToken } = require('../utils/tokenGen');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT and attaches the *fresh* user document to
 * req.user (rather than trusting the JWT payload as the source of
 * truth). This means role/sellerStatus changes made by an admin take
 * effect on the user's very next request, without requiring them to
 * log in again for a new token.
 */
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    if (user.blocked) {
      return res.status(403).json({
        message: `Your account has been blocked.${user.blockReason ? ` Reason: ${user.blockReason}` : ''}`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
