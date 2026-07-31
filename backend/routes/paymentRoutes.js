import express from "express";

import {
  initializePayment,
  verifyPayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chapa/initialize", protect, initializePayment);

router.get("/chapa/verify/:tx_ref", protect, verifyPayment);

export default router;