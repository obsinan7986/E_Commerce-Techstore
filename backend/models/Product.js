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
    compareAtPrice: {
      type:    Number,
      default: 0,
      min:     0,
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

    // ── Commission Override (Owner/Admin agreed rate) ────────
    commissionOverride: {
      type:    Number,
      default: null, // If set, overrides seller's default rate
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Virtual calculation previews
productSchema.virtual("estimatedCommission").get(function () {
  const rate = this.commissionOverride !== null && this.commissionOverride !== undefined ? this.commissionOverride : 10;
  return Number(((this.price || 0) * (rate / 100)).toFixed(2));
});

productSchema.virtual("estimatedSellerNet").get(function () {
  const rate = this.commissionOverride !== null && this.commissionOverride !== undefined ? this.commissionOverride : 10;
  const comm = Number(((this.price || 0) * (rate / 100)).toFixed(2));
  return Number(((this.price || 0) - comm).toFixed(2));
});

// Index for fast "show approved products" queries
productSchema.index({ approvalStatus: 1 });
productSchema.index({ seller: 1, approvalStatus: 1 });
productSchema.index({ approvalStatus: 1, createdAt: -1 });
productSchema.index({ category: 1, approvalStatus: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
