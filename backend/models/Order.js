import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    // ── Immutable Financial Snapshot per Item ───────────────
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    grossItemTotal: {
      type: Number,
      default: 0, // price * quantity
    },

    commissionRateApplied: {
      type: Number,
      default: 0,
    },

    commissionDebited: {
      type: Number,
      default: 0, // Amount deducted from seller's price
    },

    sellerNetEarning: {
      type: Number,
      default: 0, // grossItemTotal - commissionDebited
    },
  },
  {
    _id: false,
  }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    city: String,
    subCity: String,
    address: String,
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [orderItemSchema],

    shippingAddress: shippingSchema,

    paymentMethod: {
      type: String,
      enum: [
        "Chapa",
        "CBE Birr",
        "Telebirr",
        "M-Pesa",
        "Awash Bank",
        "Cash On Delivery",
      ],
      default: "Cash On Delivery",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    itemsPrice: {
      type: Number,
      required: true,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    taxPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    paymentResult: {
      transactionId: { type: String, default: "" },
      txRef:         { type: String, default: "" },
      status:        { type: String, default: "" },
      method:        { type: String, default: "" },
      amount:        { type: Number, default: 0  },
      currency:      { type: String, default: "ETB" },
    },

    // ── Manual payment verification (CBE Birr, Bank Transfer) ──────
    manualPayment: {
      screenshotUrl:    { type: String, default: "" },
      uploadedAt:       { type: Date },
      verificationStatus: {
        type:    String,
        enum:    ["None", "Pending", "Verified", "Rejected"],
        default: "None",
      },
      adminNote:        { type: String, default: "" },
      reviewedAt:       { type: Date },
      reviewedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    paidAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    // ── Coupon / discount applied to this order ────────────────
    coupon: {
      code:           { type: String, default: "" },
      type:           { type: String, default: "" },   // "percentage" | "fixed" | "first_order"
      discount:       { type: Number, default: 0  },   // % or ETB value
      discountAmount: { type: Number, default: 0  },   // actual ETB saved
    },

    // ── Automated CEO-Seller Commission & Revenue Split ────────
    totalGrossItemsPrice: {
      type: Number,
      default: 0,
    },

    totalCommissionDebited: {
      type: Number,
      default: 0, // Sum of all item commissions added to Finance
    },

    totalSellerNetPayout: {
      type: Number,
      default: 0, // Sum of all seller net earnings
    },

    isCommissionSettled: {
      type: Boolean,
      default: false, // Prevents double-settlement
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;