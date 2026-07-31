import express from "express";
import {
  createCoupon,
  getCoupons,
  applyCoupon,
} from "../controllers/couponController.js";

import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Admin
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);

// Customer
router.post("/apply", protect, applyCoupon);

export default router;