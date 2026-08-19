/**
 * Owner Controller
 * All routes require role = "owner"
 *
 * Capabilities:
 *  - List all users with filters
 *  - Create accounts for seller / admin / finance / owner
 *  - Promote / demote any user
 *  - Suspend / activate any user
 *  - Review KYC: approve or reject (with reason)
 *  - List pending KYC submissions
 */
import User         from "../models/User.js";
import bcrypt       from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// Roles an owner is allowed to assign
const ASSIGNABLE_ROLES = ["customer", "seller", "admin", "finance", "owner"];

// ============================================================
// GET ALL USERS  –  GET /api/owner/users
// ============================================================
export const ownerGetAllUsers = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 15, 1), 100);
    const keyword = (req.query.keyword || "").trim();
    const { role, kycStatus, isSuspended } = req.query;

    const filter = {};
    if (role && ASSIGNABLE_ROLES.includes(role)) filter.role = role;
    if (["not_submitted","pending","verified","rejected"].includes(kycStatus))
      filter.kycStatus = kycStatus;
    if (isSuspended === "true")  filter.isSuspended = true;
    if (isSuspended === "false") filter.isSuspended = false;
    if (keyword) {
      filter.$or = [
        { fullName: { $regex: keyword, $options: "i" } },
        { email:    { $regex: keyword, $options: "i" } },
        { phone:    { $regex: keyword, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CREATE USER  –  POST /api/owner/users
// Body: { fullName, email, password, phone, role }
// ============================================================
export const ownerCreateUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return res.status(400).json({ success: false, message: "fullName, email, phone and password are required." });
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${ASSIGNABLE_ROLES.join(", ")}` });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      password: hashed,
      phone:    phone.trim(),
      role,
      // sellers created by owner start as verified (trust)
      kycStatus: role === "seller" ? "verified" : "not_submitted",
    });

    res.status(201).json({
      success: true,
      message: `${role} account created.`,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, kycStatus: user.kycStatus },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CHANGE ROLE  –  PUT /api/owner/users/:id/role
// Body: { role }
// ============================================================
export const ownerChangeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${ASSIGNABLE_ROLES.join(", ")}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Prevent demoting last owner
    if (user.role === "owner" && role !== "owner") {
      const ownerCount = await User.countDocuments({ role: "owner" });
      if (ownerCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot demote the only owner account." });
      }
    }
    // Owner cannot change their own role
    if (req.user._id.toString() === req.params.id && role !== "owner") {
      return res.status(400).json({ success: false, message: "You cannot change your own role." });
    }

    user.role = role;
    // Auto-verify KYC when owner promotes to seller
    if (role === "seller" && user.kycStatus === "not_submitted") {
      user.kycStatus = "verified";
    }
    await user.save();

    res.status(200).json({ success: true, message: `Role changed to ${role}.`, user: { _id: user._id, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SUSPEND USER  –  PATCH /api/owner/users/:id/suspend
// ============================================================
export const ownerSuspendUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: "You cannot suspend your own account." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.isSuspended = true;
    await user.save();

    res.status(200).json({ success: true, message: "User suspended." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ACTIVATE USER  –  PATCH /api/owner/users/:id/activate
// ============================================================
export const ownerActivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.isSuspended = false;
    await user.save();

    res.status(200).json({ success: true, message: "User activated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// LIST PENDING KYC  –  GET /api/owner/kyc
// ============================================================
export const ownerGetPendingKYC = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const validStatuses = ["not_submitted", "pending", "verified", "rejected"];
    const filter = { kycStatus: validStatuses.includes(status) ? status : "pending" };

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// APPROVE KYC  –  PATCH /api/owner/kyc/:id/approve
// ============================================================
export const ownerApproveKYC = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.role !== "seller") {
      return res.status(400).json({ success: false, message: "KYC is only applicable to sellers." });
    }

    user.kycStatus           = "verified";
    user.kycRejectionReason  = "";
    user.kycReviewedBy       = req.user._id;
    user.kycReviewedAt       = new Date();
    await user.save();

    res.status(200).json({ success: true, message: "KYC approved. Seller can now add products." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// REJECT KYC  –  PATCH /api/owner/kyc/:id/reject
// Body: { reason }
// ============================================================
export const ownerRejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.role !== "seller") {
      return res.status(400).json({ success: false, message: "KYC is only applicable to sellers." });
    }

    user.kycStatus           = "rejected";
    user.kycRejectionReason  = reason.trim();
    user.kycReviewedBy       = req.user._id;
    user.kycReviewedAt       = new Date();
    await user.save();

    res.status(200).json({ success: true, message: "KYC rejected.", reason: user.kycRejectionReason });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SINGLE USER  –  GET /api/owner/users/:id
// ============================================================
export const ownerGetUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
