import User           from "../models/User.js";
import bcrypt         from "bcryptjs";
import generateToken  from "../utils/generateToken.js";
import { sendTemplate } from "../utils/emailService.js";
import { welcomeEmail, passwordResetEmail } from "../utils/emailTemplates.js";

// ============================================================
// REGISTER USER
// POST /api/auth/register
// ============================================================
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    // ── Field validation (400) ──────────────────────────────
    const missing = [];
    if (!fullName?.trim()) missing.push("fullName");
    if (!email?.trim())    missing.push("email");
    if (!phone?.trim())    missing.push("phone");
    if (!password)         missing.push("password");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Required fields missing: ${missing.join(", ")}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // ── Duplicate email (409) ───────────────────────────────
    const userExists = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Hash password ───────────────────────────────────────
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create user (201) ───────────────────────────────────
    const user = await User.create({
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      password: hashedPassword,
      phone:    phone.trim(),
      address:  address?.trim() || "",
    });

    const token = generateToken(user._id);

    console.log(
      `[register] New user created: ${user.email} (id: ${user._id})`
    );

    // Send welcome email (fire-and-forget)
    sendTemplate(user.email, welcomeEmail({
      fullName:    user.fullName,
      email:       user.email,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    })).catch(() => {});

    return res.status(201).json({
      success:  true,
      _id:      user._id,
      fullName: user.fullName,
      email:    user.email,
      phone:    user.phone,
      address:  user.address,
      role:     user.role,
      isAdmin:  user.isAdmin,
      token,
    });

  } catch (error) {
    // Log the real error in the terminal for debugging
    console.error("[register] Unexpected error:", error.message, error.stack);

    // Mongoose duplicate key (race condition — fallback)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(" "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error. Please try again.",
    });
  }
};

// ============================================================
// LOGIN USER
// POST /api/auth/login
// ============================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    console.log(`[login] User authenticated: ${user.email}`);

    return res.status(200).json({
      success:  true,
      _id:      user._id,
      fullName: user.fullName,
      email:    user.email,
      phone:    user.phone,
      address:  user.address,
      role:     user.role,
      isAdmin:  user.isAdmin,
      token,
    });

  } catch (error) {
    console.error("[login] Unexpected error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error. Please try again.",
    });
  }
};

// ============================================================
// GET PROFILE
// GET /api/auth/profile
// ============================================================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json(user);

  } catch (error) {
    console.error("[getUserProfile] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE PROFILE
// PUT /api/auth/profile
// ============================================================
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { fullName, phone, address } = req.body;

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone    !== undefined) user.phone    = phone.trim();
    if (address  !== undefined) user.address  = address.trim();

    const updated = await user.save();

    return res.status(200).json({
      success:  true,
      message:  "Profile updated successfully.",
      _id:      updated._id,
      fullName: updated.fullName,
      email:    updated.email,
      phone:    updated.phone,
      address:  updated.address,
      role:     updated.role,
      isAdmin:  updated.isAdmin,
      createdAt:updated.createdAt,
    });

  } catch (error) {
    console.error("[updateUserProfile] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// REQUEST PASSWORD RESET
// POST /api/auth/forgot-password
// Body: { email }
// ============================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return 200 to prevent user enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    // Generate a simple token (JWT with 1h expiry)
    const jwt = (await import("jsonwebtoken")).default;
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl    = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendTemplate(user.email, passwordResetEmail({
      fullName:  user.fullName,
      resetUrl,
      expiresIn: "1 hour",
    }));

    console.log(`[forgotPassword] Reset email sent to: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[forgotPassword] Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to process request." });
  }
};

// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// Body: { token, newPassword }
// ============================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const jwt = (await import("jsonwebtoken")).default;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link. Please request a new one." });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ success: false, message: "Invalid token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(`[resetPassword] Password reset for: ${user.email}`);

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("[resetPassword] Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};
