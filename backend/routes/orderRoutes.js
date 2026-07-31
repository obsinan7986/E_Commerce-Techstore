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

const router = express.Router();

// Customer
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// Admin (admin middleware will be added later)
router.get("/", protect, getAllOrders);
router.put("/:id/status", protect, updateOrderStatus);
router.put("/:id/cancel", protect, cancelOrder);

export default router;