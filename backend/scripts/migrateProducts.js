/**
 * One-time migration: set approvalStatus = "approved" on all existing
 * products that were created before the enterprise role system was added.
 *
 * Run once:
 *   node scripts/migrateProducts.js
 */
import dotenv   from "dotenv";
import path     from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product  from "../models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Connecting to MongoDB…");
await mongoose.connect(process.env.MONGO_URI);
console.log("Connected.");

const result = await Product.updateMany(
  { approvalStatus: { $exists: false } },
  { $set: { approvalStatus: "approved" } }
);

console.log(`Migration complete: ${result.modifiedCount} product(s) updated.`);
await mongoose.disconnect();
