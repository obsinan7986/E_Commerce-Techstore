import express    from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";
import { protect }       from "../middleware/authMiddleware.js";
import { sellerSubmitKYC } from "../controllers/sellerController.js";
import upload           from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ── Email / password ──────────────────────────────────────────── */
router.post("/register",         registerUser);
router.post("/login",            loginUser);
router.get( "/profile", protect, getUserProfile);
router.put( "/profile", protect, updateUserProfile);
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password",   resetPassword);
router.post(
  "/become-seller",
  protect,
  upload.any(),
  sellerSubmitKYC
);

/* ── Address book ──────────────────────────────────────────────── */
router.get(   "/addresses",              protect, getAddresses);
router.post(  "/addresses",              protect, addAddress);
router.put(   "/addresses/:addrId",      protect, updateAddress);
router.delete("/addresses/:addrId",      protect, deleteAddress);
router.patch( "/addresses/:addrId/default", protect, setDefaultAddress);

export default router;
