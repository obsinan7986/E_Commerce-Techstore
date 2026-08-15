import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  checkCanReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/check/:productId",  protect, checkCanReview);   // auth — check eligibility
router.get("/:productId",                 getProductReviews); // public — paginated list
router.post("/",                 protect, createReview);
router.put("/:id",               protect, updateReview);
// Owner OR admin can delete
router.delete("/:id",           protect, deleteReview);

export default router;
