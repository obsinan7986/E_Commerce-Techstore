import express from "express";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addToWishlist);

router.get("/", protect, getWishlist);

router.delete("/:productId", protect, removeFromWishlist);

export default router;