/**
 * seedRoutes.js
 * One-time seed endpoint — protected by a secret key so only you can trigger it.
 * DELETE this file and the route after seeding is complete.
 *
 * Trigger: GET /api/seed?key=SEED_SECRET_2024
 */
import express        from "express";
import Product        from "../models/Product.js";

const router = express.Router();

const SEED_KEY = process.env.SEED_KEY || "SEED_SECRET_2024";

const products = [
  { name: "iPhone 15 Pro",           brand: "Apple",   category: "Smartphones",  image: "/uploads/iPhone15.jpg",       price: 999,  stock: 25, rating: 4.8, numReviews: 12, description: "Apple iPhone 15 Pro with advanced camera system and A17 Pro chip." },
  { name: "Samsung Galaxy S25 Ultra",brand: "Samsung", category: "Smartphones",  image: "/uploads/Samsung-s25.jpg",    price: 1199, stock: 20, rating: 4.7, numReviews: 15, description: "Premium Samsung smartphone with powerful performance and S Pen." },
  { name: "MacBook Air M5",          brand: "Apple",   category: "Laptops",      image: "/uploads/macbook-air-m5.jpg", price: 1999, stock: 10, rating: 4.9, numReviews: 8,  description: "Powerful Apple laptop for professional work and creative applications." },
  { name: "Dell XPS 15",             brand: "Dell",    category: "Laptops",      image: "/uploads/dell-xps15.jpg",     price: 1499, stock: 15, rating: 4.6, numReviews: 9,  description: "Premium Windows laptop with high performance and beautiful display." },
  { name: "iPad Pro M5",             brand: "Apple",   category: "Tablets",      image: "/uploads/ipad pro m5.jpg",    price: 599,  stock: 30, rating: 4.7, numReviews: 10, description: "Lightweight and powerful tablet for work and creativity." },
  { name: "Sony WH-1000XM5",        brand: "Sony",    category: "Headphones",   image: "/uploads/sonyxm5.jpg",        price: 349,  stock: 18, rating: 4.8, numReviews: 14, description: "Premium wireless noise-cancelling headphones." },
  { name: "Apple Watch Series 10",   brand: "Apple",   category: "Smartwatches", image: "/uploads/Apple Watch.jpg",    price: 429,  stock: 22, rating: 4.6, numReviews: 7,  description: "Advanced smartwatch with health and fitness features." },
  { name: "PlayStation 5",           brand: "Sony",    category: "Gaming",       image: "/uploads/Ps5.jpg",            price: 499,  stock: 12, rating: 4.9, numReviews: 20, description: "Next-generation gaming console with high-speed SSD." },
  { name: "JBL Charge 6",            brand: "JBL",     category: "Speakers",     image: "/uploads/jblcharge6.jpg",     price: 179,  stock: 25, rating: 4.5, numReviews: 11, description: "Portable Bluetooth speaker with powerful sound and long battery life." },
  { name: "Canon EOS R8",            brand: "Canon",   category: "Cameras",      image: "/uploads/canonr8.jpg",        price: 799,  stock: 8,  rating: 4.7, numReviews: 6,  description: "Compact mirrorless camera for photography and video." },
  { name: "Samsung Galaxy Tab S10",  brand: "Samsung", category: "Tablets",      image: "/uploads/galaxytabs10.jpg",   price: 649,  stock: 14, rating: 4.5, numReviews: 8,  description: "Premium Android tablet with vibrant display." },
  { name: "Samsung Smart TV 55\"",   brand: "Samsung", category: "Televisions",  image: "/uploads/samsungtv.jpg",      price: 899,  stock: 10, rating: 4.6, numReviews: 11, description: "4K UHD Smart TV with stunning picture quality." },
  { name: "Asus ROG Gaming Laptop",  brand: "Asus",    category: "Laptops",      image: "/uploads/asus-rog.jpg",       price: 1799, stock: 8,  rating: 4.7, numReviews: 9,  description: "High-performance gaming laptop with RTX graphics." },
  { name: "AirPods Pro",             brand: "Apple",   category: "Headphones",   image: "/uploads/airpodspro.jpg",     price: 249,  stock: 30, rating: 4.8, numReviews: 18, description: "Premium wireless earbuds with active noise cancellation." },
  { name: "Xbox Series X",           brand: "Microsoft", category: "Gaming",     image: "/uploads/xboxx.jpg",          price: 499,  stock: 12, rating: 4.8, numReviews: 16, description: "Microsoft's most powerful Xbox console." },
];

router.get("/", async (req, res) => {
  // Key guard — anyone who knows the key can seed
  if (req.query.key !== SEED_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    // Check if products already exist
    const count = await Product.countDocuments();
    if (count > 0 && req.query.force !== "true") {
      return res.status(200).json({
        success: true,
        message: `Database already has ${count} products. Add ?force=true to reseed.`,
        count,
      });
    }

    await Product.deleteMany({});
    const created = await Product.insertMany(products);

    return res.status(200).json({
      success: true,
      message: `✅ Seeded ${created.length} products successfully.`,
      count: created.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Make admin endpoint ───────────────────────────────────────────
// GET /api/seed/make-admin?key=SEED_SECRET_2024&email=your@email.com
import User   from "../models/User.js";
import bcrypt from "bcryptjs";

router.get("/make-admin", async (req, res) => {
  if (req.query.key !== SEED_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  const { email, password, name } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, message: "email query param required." });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Promote existing user to admin
      user.role    = "admin";
      user.isAdmin = true;
      await user.save();
      return res.status(200).json({
        success: true,
        message: `✅ User ${email} promoted to admin.`,
        user: { _id: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
      });
    }

    // Create new admin user if not exists
    if (!password || !name) {
      return res.status(400).json({ success: false, message: "User not found. Provide name and password to create new admin." });
    }

    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({
      fullName: name,
      email:    email.toLowerCase(),
      password: hashed,
      phone:    "0000000000",
      role:     "admin",
      isAdmin:  true,
    });

    return res.status(201).json({
      success: true,
      message: `✅ Admin user created: ${email}`,
      user: { _id: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
