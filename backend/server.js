import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import productRoutes  from "./routes/productRoutes.js";
import authRoutes     from "./routes/authRoutes.js";
import uploadRoutes   from "./routes/uploadRoutes.js";
import cartRoutes     from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes    from "./routes/orderRoutes.js";
import paymentRoutes  from "./routes/paymentRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import adminRoutes    from "./routes/adminRoutes.js";
import reviewRoutes       from "./routes/reviewRoutes.js";
import couponRoutes       from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes      from "./routes/messageRoutes.js";

// Load environment variables
dotenv.config();

// Connect database
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth",     authRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/reviews",        reviewRoutes);
app.use("/api/coupons",        couponRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/messages",       messageRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Tech E-commerce API is running...");
});

// 404 handler for unknown API routes
app.use("/api/*path", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const statusCode = err.statusCode || err.status || 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(isDev && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
