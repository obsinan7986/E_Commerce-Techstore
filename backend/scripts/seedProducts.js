import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Only load .env file in local development.
// On Render/production, env vars are injected directly — no .env file needed.
// Use __dirname-based path to ensure it finds the right .env regardless of CWD.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../.env") });
} else {
  // Even in production, load .env with explicit path as a fallback
  // in case Render env vars aren't injected (defensive)
  dotenv.config({ path: path.join(__dirname, "../.env") });
}

console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);

const products = [
  {
    name: "iPhone 15 Pro",
    description:
      "Apple iPhone 15 Pro with advanced camera system and A17 Pro chip.",
    brand: "Apple",
    category: "Smartphones",
    image: "/uploads/iPhone15.jpg",
    price: 999,
    stock: 25,
    rating: 4.8,
    numReviews: 12,
  },

  {
    name: "Samsung Galaxy S24 Ultra",
    description:
      "Premium Samsung smartphone with powerful performance and S Pen.",
    brand: "Samsung",
    category: "Smartphones",
    image: "/uploads/Samsung-s25.jpg",
    price: 1199,
    stock: 20,
    rating: 4.7,
    numReviews: 15,
  },

  {
    name: "MacBook Pro 14",
    description:
      "Powerful Apple laptop for professional work and creative applications.",
    brand: "Apple",
    category: "Laptops",
    image: "/uploads/macbook-air-m5.jpg",
    price: 1999,
    stock: 10,
    rating: 4.9,
    numReviews: 8,
  },

  {
    name: "Dell XPS 15",
    description:
      "Premium Windows laptop with high performance and beautiful display.",
    brand: "Dell",
    category: "Laptops",
    image: "/uploads/dell-xps15.jpg",
    price: 1499,
    stock: 15,
    rating: 4.6,
    numReviews: 9,
  },

  {
    name: "iPad Air",
    description:
      "Lightweight and powerful tablet for work, entertainment and creativity.",
    brand: "Apple",
    category: "Tablets",
    image: "/uploads/ipad pro m5.jpg",
    price: 599,
    stock: 30,
    rating: 4.7,
    numReviews: 10,
  },

  {
    name: "Sony WH-1000XM5",
    description:
      "Premium wireless noise-cancelling headphones.",
    brand: "Sony",
    category: "Headphones",
    image: "/uploads/sonyxm5.jpg",
    price: 349,
    stock: 18,
    rating: 4.8,
    numReviews: 14,
  },

  {
    name: "Apple Watch Series 10",
    description:
      "Advanced smartwatch with health and fitness features.",
    brand: "Apple",
    category: "Smartwatches",
    image: "/uploads/Apple Watch.jpg",
    price: 429,
    stock: 22,
    rating: 4.6,
    numReviews: 7,
  },

  {
    name: "PlayStation 5",
    description:
      "Next-generation gaming console with high-speed SSD.",
    brand: "Sony",
    category: "Gaming",
    image: "/uploads/Ps5.jpg",
    price: 499,
    stock: 12,
    rating: 4.9,
    numReviews: 20,
  },

  {
    name: "JBL Charge 5",
    description:
      "Portable Bluetooth speaker with powerful sound and long battery life.",
    brand: "JBL",
    category: "Speakers",
    image: "/uploads/jblcharge6.jpg",
    price: 179,
    stock: 25,
    rating: 4.5,
    numReviews: 11,
  },

  {
    name: "Canon EOS R50",
    description:
      "Compact mirrorless camera for photography and video.",
    brand: "Canon",
    category: "Cameras",
    image: "/uploads/canonr8.jpg",
    price: 799,
    stock: 8,
    rating: 4.7,
    numReviews: 6,
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);

    // Remove existing products before inserting the seed products.
    await Product.deleteMany({});

    const createdProducts = await Product.insertMany(products);

    console.log(
      `Successfully seeded ${createdProducts.length} products.`
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Product seed failed:", error);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
};

seedProducts();