import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type:     String,
      required: true,
      trim:     true,
    },

    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    password: {
      type:      String,
      minlength: 6,
      default:   null,
    },

    phone: {
      type:    String,
      default: "",
    },

    googleId: {
      type:   String,
      default: null,
      index:  true,
      sparse: true,
    },

    authProvider: {
      type:    String,
      enum:    ["local", "google"],
      default: "local",
    },

    // ── Role ────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ["customer", "seller", "admin", "finance", "owner"],
      default: "customer",
    },

    // Legacy boolean — kept for backward-compat with existing middleware
    // Automatically synced in pre-save hook
    isAdmin: {
      type:    Boolean,
      default: false,
    },

    // ── Account status ───────────────────────────────────────
    isSuspended: {
      type:    Boolean,
      default: false,
    },

    // ── KYC (required for sellers) ───────────────────────────
    kycStatus: {
      type:    String,
      enum:    ["not_submitted", "pending", "verified", "rejected"],
      default: "not_submitted",
    },

    kycDocs: {
      idFront:  { type: String, default: "" }, // path to National ID front image
      idBack:   { type: String, default: "" }, // path to National ID back image
      selfie:   { type: String, default: "" }, // path to selfie image
    },

    kycRejectionReason: {
      type:    String,
      default: "",
    },

    kycReviewedBy: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   "User",
      default: null,
    },

    kycReviewedAt: {
      type:    Date,
      default: null,
    },

    // ── Profile ──────────────────────────────────────────────
    address: {
      type:    String,
      default: "",
    },

    profileImage: {
      type:    String,
      default: "",
    },

    firstOrderDiscountUsed: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Sync isAdmin flag with role ──────────────────────────────
userSchema.pre("save", function () {
  this.isAdmin = (this.role === "admin" || this.role === "owner");
});

const User = mongoose.model("User", userSchema);
export default User;
