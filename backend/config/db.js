import mongoose from "mongoose";
import User      from "../models/User.js";

const connectDB = async () => {
  try {
    // Log what we're connecting to (mask password)
    const uri = process.env.MONGO_URI || "";
    const masked = uri.replace(/:([^@]+)@/, ":****@");
    console.log(`[db] Connecting to: ${masked || "⚠ MONGO_URI is UNDEFINED"}`);

    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set.");
    }

    const conn = await mongoose.connect(uri);

    console.log(`[db] ✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`[db]    Database name: ${conn.connection.name}`);

    // Keep role + isAdmin in sync for legacy documents
    await User.updateMany(
      { role: "admin",    isAdmin: { $ne: true } },
      { $set: { isAdmin: true  } }
    );
    await User.updateMany(
      { role: "customer", isAdmin: true },
      { $set: { isAdmin: false } }
    );

  } catch (error) {
    console.error("[db] ❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
