import express from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";

const router = express.Router();

// ==========================================
// CUSTOMER
// ==========================================

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, validateObjectId(), getOrderById);
router.put("/:id/cancel", protect, validateObjectId(), cancelOrder);

// ==========================================
// ADMIN (kept for existing frontend usage)
// ==========================================

router.get("/", protect, admin, getAllOrders);
router.put(
  "/:id/status",
  protect,
  admin,
  validateObjectId(),
  updateOrderStatus
);

export default router;
