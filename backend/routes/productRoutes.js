import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getFeaturedProducts,
} from "../controllers/productController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================
// Public Routes
// =========================

// Get all products
router.get("/", getProducts);

// Featured products
router.get("/featured", getFeaturedProducts);

// Related products
router.get("/related", getRelatedProducts);

// Single product (KEEP LAST among GET routes)
router.get("/:id", getProductById);

// =========================
// Admin Routes
// =========================

// Create product
router.post("/", protect, admin, createProduct);

// Update product
router.put("/:id", protect, admin, updateProduct);

// Delete product
router.delete("/:id", protect, admin, deleteProduct);

export default router;