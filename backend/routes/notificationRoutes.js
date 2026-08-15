import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/",                      getNotifications);
router.get("/unread-count",          getUnreadCount);
router.patch("/mark-all-read",       markAllAsRead);
router.patch("/:id/read",            markAsRead);
router.delete("/",                   clearAllNotifications);
router.delete("/:id",                deleteNotification);

export default router;
