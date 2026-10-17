import express    from "express";
import passport   from "../config/passport.js";
import generateToken from "../utils/generateToken.js";
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
router.post("/become-seller", protect, upload.single("idDocumentImage"), sellerSubmitKYC);

/* ── Address book ──────────────────────────────────────────────── */
router.get(   "/addresses",              protect, getAddresses);
router.post(  "/addresses",              protect, addAddress);
router.put(   "/addresses/:addrId",      protect, updateAddress);
router.delete("/addresses/:addrId",      protect, deleteAddress);
router.patch( "/addresses/:addrId/default", protect, setDefaultAddress);

/* ── Google OAuth ──────────────────────────────────────────────── */

// Step 1 — redirect user to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2 — Google redirects back here with auth code
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session:         false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontend}/login?error=google_failed`);
      }
      const token = generateToken(user._id);
      const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontend}/oauth-callback?token=${token}`);
    } catch (err) {
      console.error("[google/callback] Error:", err.message);
      const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontend}/login?error=google_failed`);
    }
  }
);

export default router;
