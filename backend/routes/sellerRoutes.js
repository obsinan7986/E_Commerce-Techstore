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
  sellerUpdatePayoutAccount,
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

// KYC & Payout Account
router.get(  "/kyc",            ...sellerOnly, sellerGetKYCStatus);
router.post( "/kyc",            ...sellerOnly, sellerSubmitKYC);
router.get(  "/payout-account", ...sellerOnly, sellerGetKYCStatus);
router.put(  "/payout-account", ...sellerOnly, sellerUpdatePayoutAccount);

// Reviews (read-only)
router.get( "/reviews", ...sellerOnly, sellerGetReviews);

export default router;
