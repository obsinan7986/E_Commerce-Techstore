/**
 * adminMiddleware — backward-compatible guard.
 * Allows role: admin OR owner (both have isAdmin = true via pre-save hook).
 * Always run after protect().
 */
export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }
  if (req.user.isSuspended) {
    return res.status(403).json({ success: false, message: "Your account has been suspended." });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};
