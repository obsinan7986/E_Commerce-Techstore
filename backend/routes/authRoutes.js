import express    from "express";
import passport   from "../config/passport.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect }       from "../middleware/authMiddleware.js";
import generateToken     from "../utils/generateToken.js";

const router = express.Router();

/* ── Email / password ──────────────────────────────────────────── */
router.post("/register",         registerUser);
router.post("/login",            loginUser);
router.get( "/profile", protect, getUserProfile);
router.put( "/profile", protect, updateUserProfile);
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password",   resetPassword);

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
    session:      false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_failed`,
  }),
  (req, res) => {
    // Passport attached the user to req.user via the strategy
    const user  = req.user;
    const token = generateToken(user._id);

    // Build the user payload the frontend expects (same shape as /login)
    const payload = {
      _id:      user._id,
      fullName: user.fullName,
      email:    user.email,
      phone:    user.phone,
      address:  user.address,
      role:     user.role,
      isAdmin:  user.isAdmin,
      profileImage: user.profileImage,
      token,
    };

    // Encode as base64 so it survives the URL redirect safely
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontend}/auth/google/success?data=${encoded}`);
  }
);

export default router;
