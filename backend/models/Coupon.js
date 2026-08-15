import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  true,
      unique:    true,
      uppercase: true,
      trim:      true,
      maxlength: 30,
    },

    description: {
      type:    String,
      default: "",
      trim:    true,
    },

    // "percentage" = e.g. 10% off  |  "fixed" = e.g. ETB 200 off
    type: {
      type:    String,
      enum:    ["percentage", "fixed"],
      default: "percentage",
    },

    // Percent value (1-100) OR fixed ETB amount
    discount: {
      type:     Number,
      required: true,
      min:      1,
    },

    // Minimum subtotal (itemsPrice) required to use the coupon (0 = no minimum)
    minOrderAmount: {
      type:    Number,
      default: 0,
    },

    expiresAt: {
      type:     Date,
      required: true,
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    // Maximum total redemptions across all users (0 = unlimited)
    usageLimit: {
      type:    Number,
      default: 0,
    },

    // Incremented each time the coupon is successfully used
    usedCount: {
      type:    Number,
      default: 0,
    },

    // Users who have already used this coupon (prevents double-use per user)
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    }],

    // If true, only users placing their FIRST order ever can use it
    isFirstOrderOnly: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
