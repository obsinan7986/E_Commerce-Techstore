import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin }   from "../middleware/adminMiddleware.js";
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
} from "../controllers/bannerController.js";

const router = express.Router();

const adminOnly = [protect, admin];

// ── Public ────────────────────────────────────────────────
// GET /api/banners  — homepage slider (active + in-date-range only)
router.get("/", getActiveBanners);

// ── Admin ─────────────────────────────────────────────────
// All banner management is also reachable under /api/admin/banners
// (registered via adminRoutes.js), but these are kept here too
// for a clean REST namespace.
router.get(   "/admin",         ...adminOnly, getAllBanners);
router.post(  "/admin",         ...adminOnly, createBanner);
router.put(   "/admin/:id",     ...adminOnly, updateBanner);
router.delete("/admin/:id",     ...adminOnly, deleteBanner);
router.patch( "/admin/:id/toggle", ...adminOnly, toggleBanner);

export default router;
