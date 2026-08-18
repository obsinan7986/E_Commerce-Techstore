import express          from "express";
import cors             from "cors";
import dotenv           from "dotenv";
import path             from "path";
import { fileURLToPath } from "url";

// ── ESM-safe path resolution ──────────────────────────────────────
// Must be declared before dotenv so __dirname is available.
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Load .env FIRST — explicit path so it works regardless of CWD ─
// On Render the process is started from the repo root, not /backend.
// Using __dirname ensures we always find backend/.env correctly.
dotenv.config({ path: path.join(__dirname, ".env") });

// ── All other imports come AFTER dotenv ───────────────────────────
// (static imports are hoisted by the JS engine, but dotenv mutates
//  process.env synchronously so by the time these modules execute
//  their top-level code, process.env.MONGO_URI etc. are available.)
import connectDB          from "./config/db.js";
import productRoutes      from "./routes/productRoutes.js";
import authRoutes         from "./routes/authRoutes.js";
import uploadRoutes       from "./routes/uploadRoutes.js";
import cartRoutes         from "./routes/cartRoutes.js";
import wishlistRoutes     from "./routes/wishlistRoutes.js";
import orderRoutes        from "./routes/orderRoutes.js";
import paymentRoutes      from "./routes/paymentRoutes.js";
import checkoutRoutes     from "./routes/checkoutRoutes.js";
import adminRoutes        from "./routes/adminRoutes.js";
import reviewRoutes       from "./routes/reviewRoutes.js";
import couponRoutes       from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes      from "./routes/messageRoutes.js";
import seedRoutes         from "./routes/seedRoutes.js";

// ── Connect to MongoDB ────────────────────────────────────────────
connectDB();

// ── Express app ───────────────────────────────────────────────────
const app = express();

// ── CORS ──────────────────────────────────────────────────────────
// Allow localhost (dev) + deployed Vercel frontend (prod).
// FRONTEND_URL must be set in Render env vars to your Vercel URL.
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);              // Postman, health checks
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== "production") return cb(null, true); // dev: allow all
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Static uploads ────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ────────────────────────────────────────────────────
app.use("/api/products",      productRoutes);
app.use("/api/auth",          authRoutes);
app.use("/api/upload",        uploadRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/wishlist",      wishlistRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/checkout",      checkoutRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/coupons",       couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages",      messageRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Tech E-commerce API is running...");
});

// ── 404 for unknown /api routes ───────────────────────────────────
app.use("/api/*path", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  const isDev      = process.env.NODE_ENV !== "production";
  const statusCode = err.statusCode || err.status || 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(isDev && { stack: err.stack }),
  });
});

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   NODE_ENV:  ${process.env.NODE_ENV}`);
  console.log(`   MONGO_URI: ${process.env.MONGO_URI ? "✓ loaded" : "✗ MISSING"}`);
  console.log(`   JWT_SECRET:${process.env.JWT_SECRET ? " ✓ loaded" : " ✗ MISSING"}`);
});
