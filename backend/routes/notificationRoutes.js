import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  // admin
  getAdminNotifications,
  getAdminUnreadNotifCount,
  markAdminNotifAsRead,
  markAllAdminNotifsRead,
  deleteAdminNotif,
  clearAllAdminNotifs,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

/* ── User routes ─────────────────────────────────── */
router.get(    "/",                getNotifications);
router.get(    "/unread-count",    getUnreadCount);
router.patch(  "/mark-all-read",   markAllAsRead);
router.patch(  "/:id/read",        markAsRead);
router.delete( "/",                clearAllNotifications);
router.delete( "/:id",             deleteNotification);

/* ── Admin routes ────────────────────────────────── */
router.get(    "/admin",                  admin, getAdminNotifications);
router.get(    "/admin/unread-count",     admin, getAdminUnreadNotifCount);
router.patch(  "/admin/mark-all-read",    admin, markAllAdminNotifsRead);
router.patch(  "/admin/:id/read",         admin, markAdminNotifAsRead);
router.delete( "/admin",                  admin, clearAllAdminNotifs);
router.delete( "/admin/:id",              admin, deleteAdminNotif);

export default router;
