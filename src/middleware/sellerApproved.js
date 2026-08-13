/**
 * Gate for seller-only business routes (painting CRUD, order fulfillment).
 * Requires both role==='seller' AND sellerStatus==='approved' — a user
 * whose application is merely 'pending' must not be able to list
 * paintings or touch orders yet. Must run after `auth`.
 */
function sellerApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (req.user.role !== 'seller' || req.user.sellerStatus !== 'approved') {
    return res.status(403).json({
      message: 'This action requires an approved seller account.',
    });
  }
  next();
}

module.exports = sellerApproved;
