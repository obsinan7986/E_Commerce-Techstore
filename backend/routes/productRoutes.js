import express from "express";

import {
  getProducts,
  getProductById,
  getRelatedProducts,
  getFeaturedProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "../controllers/productController.js";

const router = express.Router();

/*
=========================================
Public Routes
=========================================
*/

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getProductsByCategory);
router.get("/search/:keyword", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/related/:id", getRelatedProducts);
router.get("/:id", getProductById);

export default router;
