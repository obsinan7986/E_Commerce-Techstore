import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
   category: {
  type: String,
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
    "Smartwatches"
  ]
 },
    image: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
     rating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model("Product", productSchema);

export default Product;