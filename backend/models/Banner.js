import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type:    String,
      required: [true, "Banner title is required."],
      trim:    true,
      maxlength: 80,
    },
    subtitle: {
      type:    String,
      trim:    true,
      maxlength: 160,
      default: "",
    },
    image: {
      type:    String,
      required: [true, "Banner image is required."],
    },
    productLink: {
      // e.g. "/products", "/product/:id", "/category/Smartphones"
      type:    String,
      trim:    true,
      default: "/products",
    },
    startDate: {
      type:    Date,
      required: [true, "Start date is required."],
    },
    endDate: {
      type:    Date,
      required: [true, "End date is required."],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    sortOrder: {
      // Lower number = shown first
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual: is this banner currently live?
bannerSchema.virtual("isLive").get(function () {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
