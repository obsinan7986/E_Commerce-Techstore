import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is not set in environment.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const existing = await Coupon.findOne({
      isFirstOrderOnly: true,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    if (existing) {
      console.log(`Active first-order coupon "${existing.code}" already exists.`);
      process.exit(0);
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const coupon = await Coupon.create({
      code: "FIRST10",
      description: "10% off your first order",
      type: "percentage",
      discount: 10,
      minOrderAmount: 0,
      expiresAt: oneYearFromNow,
      isActive: true,
      usageLimit: 0,
      isFirstOrderOnly: true,
    });

    console.log(`✅ First-order coupon "${coupon.code}" created successfully.`);
  } catch (err) {
    console.error("Error creating first-order coupon:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
