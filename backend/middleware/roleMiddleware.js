/**
 * Role-based access middleware
 *
 * Usage:
 *   requireRole("owner")
 *   requireRole("owner", "admin")
 *   requireRole("finance")
 *
 * Always run AFTER protect() so req.user is populated.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }
  if (req.user.isSuspended) {
    return res.status(403).json({ success: false, message: "Your account has been suspended." });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires role: ${roles.join(" or ")}.`,
    });
  }
  next();
};

// Convenience named guards
export const owner   = requireRole("owner");
export const finance = requireRole("finance", "owner");
export const seller  = requireRole("seller",  "owner");

// Any staff member (admin, owner, finance — NOT seller)
export const staff   = requireRole("admin", "owner", "finance");

// Admin OR owner can manage products/orders
export const adminOrOwner = requireRole("admin", "owner");

// Suspend check only (any authenticated user, blocks suspended)
export const notSuspended = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }
  if (req.user.isSuspended) {
    return res.status(403).json({ success: false, message: "Your account has been suspended." });
  }
  next();
};
