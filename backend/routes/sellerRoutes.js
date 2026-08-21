import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  sellerGetProducts,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  sellerGetSales,
  sellerSubmitKYC,
  sellerGetKYCStatus,
  sellerGetReviews,
} from "../controllers/sellerController.js";

const router    = express.Router();
const sellerOnly = [protect, requireRole("seller", "owner")];

// Products
router.get(    "/products",      ...sellerOnly, sellerGetProducts);
router.post(   "/products",      ...sellerOnly, sellerCreateProduct);
router.put(    "/products/:id",  ...sellerOnly, sellerUpdateProduct);
router.delete( "/products/:id",  ...sellerOnly, sellerDeleteProduct);

// Sales
router.get( "/sales", ...sellerOnly, sellerGetSales);

// KYC
router.get(  "/kyc", ...sellerOnly, sellerGetKYCStatus);
router.post( "/kyc", ...sellerOnly, sellerSubmitKYC);

// Reviews (read-only)
router.get( "/reviews", ...sellerOnly, sellerGetReviews);

export default router;
