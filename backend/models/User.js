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

    status: {
      type:    String,
      enum:    ["active", "suspended", "inactive"],
      default: "active",
    },

    // ── KYC (required for sellers) ───────────────────────────
    kycStatus: {
      type:    String,
      enum:    ["not_submitted", "pending", "verified", "approved", "rejected"],
      default: "not_submitted",
    },

    storeName: {
      type:    String,
      default: "",
      trim:    true,
    },

    nationalIdNumber: {
      type:    String,
      default: "",
      trim:    true,
    },

    idDocumentImage: {
      type:    String,
      default: "",
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

    // ── Address Book (multiple saved delivery addresses) ─────
    addresses: [
      {
        _id:        { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        label:      { type: String, default: "Home" },   // e.g. Home / Work / Other
        fullName:   { type: String, required: true },
        phone:      { type: String, required: true },
        address:    { type: String, required: true },
        city:       { type: String, required: true },
        subCity:    { type: String, default: "" },
        isDefault:  { type: Boolean, default: false },
      },
    ],

    firstOrderDiscountUsed: {
      type:    Boolean,
      default: false,
    },

    // ── Seller & CEO Commission Agreement ────────────────────
    commissionAgreement: {
      commissionType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      agreedRate: {
        type: Number,
        default: 10, // Set by Owner/CEO during KYC approval or management
      },
    },

    // ── Seller Financial Balances ────────────────────────────
    sellerCredits: {
      type: Number,
      default: 0, // Net available earnings after commission debit
    },

    pendingSellerCredits: {
      type: Number,
      default: 0, // Earnings from unpaid / unverified orders
    },

    totalCommissionDebited: {
      type: Number,
      default: 0, // Total commission paid by this seller to platform
    },

    payoutAccount: {
      bankName:      { type: String, default: "" },
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      telebirrPhone: { type: String, default: "" },
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
