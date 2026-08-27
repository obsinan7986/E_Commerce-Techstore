import express from "express";
import upload   from "../middleware/uploadMiddleware.js";

import {
  getProducts,
  getProductById,
  getRelatedProducts,
  getFeaturedProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "../controllers/productController.js";

import { imageSearch } from "../controllers/imageSearchController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getProductsByCategory);
router.get("/search/:keyword", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/related/:id", getRelatedProducts);
// Image search — public, no auth required (just multer for the file)
router.post("/image-search", upload.single("image"), imageSearch);
router.get("/:id", getProductById);

export default router;
