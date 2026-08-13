/**
 * Restricts a route to one or more roles. Must run after `auth`.
 * Usage: router.get('/x', auth, role(['admin']), handler)
 */
function role(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = role;
