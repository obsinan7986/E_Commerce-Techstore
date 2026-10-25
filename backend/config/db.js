import mongoose from "mongoose";
import dns      from "dns";
import User      from "../models/User.js";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "";
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set.");
    }

    console.log("[db] Connecting to MongoDB...");

    // Dev safety check before connecting
    const uriDbName = uri.split("?")[0].split("/").pop() || "";
    if (
      process.env.NODE_ENV === "development" &&
      process.env.PRODUCTION_DB_NAME &&
      uriDbName === process.env.PRODUCTION_DB_NAME &&
      process.env.ALLOW_DEV_ON_PROD_DB !== "true"
    ) {
      console.error(
        `[db] ❌ Refusing to start in development mode on production database "${uriDbName}". Set ALLOW_DEV_ON_PROD_DB=true to override.`
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);
    const dbName = conn.connection.name;
    console.log(`[db] ✅ MongoDB connected. Database name: ${dbName}`);

    // Dev safety check after connecting
    if (
      process.env.NODE_ENV === "development" &&
      process.env.PRODUCTION_DB_NAME &&
      dbName === process.env.PRODUCTION_DB_NAME &&
      process.env.ALLOW_DEV_ON_PROD_DB !== "true"
    ) {
      console.error(
        `[db] ❌ Refusing to start in development mode on production database "${dbName}". Set ALLOW_DEV_ON_PROD_DB=true to override.`
      );
      process.exit(1);
    }

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
