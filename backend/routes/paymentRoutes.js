import express from "express";

import {
  initializeChapaPayment,
  verifyChapaPayment,
  chapaCallback,
} from "../controllers/paymentController.js";

import {
  getPaymentSettings,
  updatePaymentSettings,
  uploadPaymentScreenshot,
  verifyManualPayment,
  getPendingManualPayments,
  getManualPaymentStats,
} from "../controllers/manualPaymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import upload      from "../middleware/uploadMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";

const router = express.Router();

// ── Chapa ────────────────────────────────────────────────────────────
router.post("/chapa/initialize", protect, initializeChapaPayment);
router.get( "/chapa/verify/:txRef", protect, verifyChapaPayment);
router.get( "/chapa/callback", chapaCallback);   // no protect — called by Chapa

// ── Payment settings (QR code) ───────────────────────────────────────
router.get("/settings",                           getPaymentSettings);           // public
router.put("/settings", protect, admin, upload.single("qrCode"), updatePaymentSettings);

// ── Manual payment screenshot ────────────────────────────────────────
router.post(
  "/screenshot/:orderId",
  protect,
  validateObjectId("orderId"),
  upload.single("screenshot"),
  uploadPaymentScreenshot
);

// ── Admin/Finance manual verification ───────────────────────────────
const staffPayment = [protect, requireRole("admin", "owner", "finance")];
router.get( "/manual/stats",             ...staffPayment, getManualPaymentStats);
router.get( "/manual/pending",           ...staffPayment, getPendingManualPayments);
router.put( "/manual/:orderId/verify",   ...staffPayment, validateObjectId("orderId"), verifyManualPayment);

export default router;
