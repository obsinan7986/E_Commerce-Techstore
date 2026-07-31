import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected:", conn.connection.host);
    console.log("Database:", conn.connection.name);

  } catch (error) {
    console.error("MongoDB Error:", error);
    process.exit(1);
  }
};

export default connectDB;