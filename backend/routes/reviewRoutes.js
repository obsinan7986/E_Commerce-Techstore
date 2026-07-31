import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.get("/:productId", getProductReviews);

export default router;