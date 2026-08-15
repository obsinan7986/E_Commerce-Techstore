import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  checkFirstOrderDiscount,
} from "../controllers/couponController.js";

const router = express.Router();

// ── Customer ──────────────────────────────────────────────────────
router.post("/apply",              protect, applyCoupon);
router.get( "/first-order-check",  protect, checkFirstOrderDiscount);

// ── Admin ─────────────────────────────────────────────────────────
router.get(    "/",     protect, admin, getCoupons);
router.post(   "/",     protect, admin, createCoupon);
router.get(    "/:id",  protect, admin, getCouponById);
router.put(    "/:id",  protect, admin, updateCoupon);
router.delete( "/:id",  protect, admin, deleteCoupon);

export default router;
