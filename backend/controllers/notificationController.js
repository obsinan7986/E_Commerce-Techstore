import Notification from "../models/Notification.js";

// ─────────────────────────────────────────────────────────────────────
// GET /api/notifications
// Returns paginated notifications for the logged-in user (newest first)
// ─────────────────────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const filter = { user: req.user._id };
    if (req.query.unreadOnly === "true") filter.isRead = false;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error("[getNotifications]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// Lightweight endpoint polled by the frontend bell
// ─────────────────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/mark-all-read
// Mark all notifications for the user as read
// ─────────────────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// Delete a single notification
// ─────────────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/notifications
// Clear all notifications for the user
// ─────────────────────────────────────────────────────────────────────
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    return res.status(200).json({ success: true, message: "All notifications cleared." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN NOTIFICATION ENDPOINTS
   Queried by targetRole:"admin" — not scoped to a single user id
   ══════════════════════════════════════════════════════════════════ */

// GET /api/notifications/admin
export const getAdminNotifications = async (req, res) => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const filter = { targetRole: "admin" };
    if (req.query.unreadOnly === "true") filter.isRead = false;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const unreadCount = await Notification.countDocuments({ targetRole: "admin", isRead: false });

    return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), unreadCount, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/notifications/admin/unread-count
export const getAdminUnreadNotifCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ targetRole: "admin", isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/admin/:id/read
export const markAdminNotifAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, targetRole: "admin" },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/admin/mark-all-read
export const markAllAdminNotifsRead = async (req, res) => {
  try {
    await Notification.updateMany({ targetRole: "admin", isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All admin notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/admin/:id
export const deleteAdminNotif = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, targetRole: "admin" });
    return res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/admin
export const clearAllAdminNotifs = async (req, res) => {
  try {
    await Notification.deleteMany({ targetRole: "admin" });
    return res.status(200).json({ success: true, message: "All admin notifications cleared." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
