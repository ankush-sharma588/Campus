/** Create a route guard for one or more authenticated user roles. */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'Login required.' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

module.exports = requireRole;
