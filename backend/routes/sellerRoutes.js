import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  sellerGetProducts,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  sellerGetSales,
  sellerGetDashboardStats,
  sellerRequestPayout,
  sellerGetPayoutHistory,
  sellerSubmitKYC,
  sellerGetKYCStatus,
  sellerGetReviews,
  sellerUpdatePayoutAccount,
} from "../controllers/sellerController.js";

import upload from "../middleware/uploadMiddleware.js";

const router    = express.Router();
const sellerOnly = [protect, requireRole("seller", "owner")];

// Dashboard & Stats
router.get( "/dashboard", ...sellerOnly, sellerGetDashboardStats);
router.get( "/stats",     ...sellerOnly, sellerGetDashboardStats);

// Products
router.get(    "/products",      ...sellerOnly, sellerGetProducts);
router.post(   "/products",      ...sellerOnly, sellerCreateProduct);
router.put(    "/products/:id",  ...sellerOnly, sellerUpdateProduct);
router.delete( "/products/:id",  ...sellerOnly, sellerDeleteProduct);

// Sales & Earnings
router.get( "/sales", ...sellerOnly, sellerGetSales);

// KYC & Payout Account (KYC submission and status open to any authenticated user)
router.get(  "/kyc",            protect, sellerGetKYCStatus);
router.post(
  "/kyc",
  protect,
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "idDocumentImage", maxCount: 1 },
  ]),
  sellerSubmitKYC
);
router.get(  "/payout-account", ...sellerOnly, sellerGetKYCStatus);
router.put(  "/payout-account", ...sellerOnly, sellerUpdatePayoutAccount);
router.post( "/payout-request", ...sellerOnly, sellerRequestPayout);
router.get(  "/payout-requests", ...sellerOnly, sellerGetPayoutHistory);
router.get(  "/payouts",        ...sellerOnly, sellerGetPayoutHistory);

// Reviews (read-only)
router.get( "/reviews", ...sellerOnly, sellerGetReviews);

// Upload alias for seller
router.post( "/upload", ...sellerOnly, upload.single("image"), (req, res) => {
  if (req.file) {
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      image: `/uploads/${req.file.filename}`,
    });
  }
  if (req.body?.image) {
    return res.status(200).json({ success: true, image: req.body.image });
  }
  return res.status(400).json({ success: false, message: "No image file provided." });
});

export default router;
