import mongoose from "mongoose";
import User from "../models/user.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Ensure role and isAdmin are in sync for any legacy documents
    await User.updateMany(
      { role: "admin", isAdmin: { $ne: true } },
      { $set: { isAdmin: true } }
    );
    await User.updateMany(
      { role: "customer", isAdmin: true },
      { $set: { isAdmin: false } }
    );

  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;