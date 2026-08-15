/**
 * Dev utility: promote a user to admin by email.
 *
 * Usage:
 *   node scripts/makeAdmin.js user@example.com
 *
 * This script is NOT an API endpoint and cannot be called remotely.
 * It only runs locally via the Node CLI.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.isAdmin && user.role === "admin") {
      console.log(`User "${user.fullName}" (${user.email}) is already an admin.`);
      process.exit(0);
    }

    user.role = "admin";
    user.isAdmin = true;
    await user.save();

    console.log(`✅ User "${user.fullName}" (${user.email}) has been promoted to admin.`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
