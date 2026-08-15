import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import {
  getMyConversation,
  sendMessage,
  markUserMessagesRead,
  getUserUnreadCount,
  getAllConversations,
  getConversationById,
  adminReply,
  adminMarkRead,
  closeConversation,
  deleteConversation,
  getAdminUnreadCount,
} from "../controllers/messageController.js";

const router = express.Router();

/* ── Customer routes ────────────────────────────────── */
router.get( "/mine",             protect, getMyConversation);
router.post("/",                 protect, sendMessage);
router.patch("/mine/read",       protect, markUserMessagesRead);
router.get( "/mine/unread-count",protect, getUserUnreadCount);

/* ── Admin routes ───────────────────────────────────── */
router.get(   "/admin",                          protect, admin, getAllConversations);
router.get(   "/admin/unread-count",             protect, admin, getAdminUnreadCount);
router.get(   "/admin/:conversationId",          protect, admin, getConversationById);
router.post(  "/admin/:conversationId/reply",    protect, admin, adminReply);
router.patch( "/admin/:conversationId/read",     protect, admin, adminMarkRead);
router.patch( "/admin/:conversationId/close",    protect, admin, closeConversation);
router.delete("/admin/:conversationId",          protect, admin, deleteConversation);

export default router;
