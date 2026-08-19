import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
    },
    description: {
      type:     String,
      required: true,
    },
    brand: {
      type:     String,
      required: true,
    },
    category: {
      type:     String,
      required: true,
      enum: [
        "Smartphones",
        "Laptops",
        "Tablets",
        "Accessories",
        "Gaming",
        "Headphones",
        "Speakers",
        "Cameras",
        "Televisions",
        "Smartwatches",
      ],
    },
    image: {
      type:    String,
      default: "",
    },
    price: {
      type:     Number,
      required: true,
    },
    stock: {
      type:    Number,
      default: 0,
    },
    rating: {
      type:    Number,
      default: 0,
    },
    numReviews: {
      type:    Number,
      default: 0,
    },

    // ── Approval workflow ────────────────────────────────────
    // Products created by admin/owner → "approved" immediately
    // Products created by seller → "pending" until admin reviews
    approvalStatus: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type:    String,
      default: "",
    },

    reviewedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },

    reviewedAt: {
      type:    Date,
      default: null,
    },

    // ── Seller ownership ─────────────────────────────────────
    // null for products created by admin/owner (no seller ownership)
    seller: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast "show approved products" queries
productSchema.index({ approvalStatus: 1 });
productSchema.index({ seller: 1, approvalStatus: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
