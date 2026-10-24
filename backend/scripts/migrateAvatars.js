/**
 * Migration script: finds users whose avatar or profileImage starts with "data:",
 * uploads them to Cloudinary, and updates their profile with the resulting URL.
 *
 * Usage:
 *   node scripts/migrateAvatars.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI environment variable is not defined.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const users = await User.find({
    $or: [
      { avatar: { $regex: /^data:/ } },
      { profileImage: { $regex: /^data:/ } },
    ],
  });

  console.log(`Found ${users.length} user(s) with base64 data URLs.`);

  let migrated = 0;
  for (const user of users) {
    try {
      let newUrl = null;
      const raw =
        user.avatar && user.avatar.startsWith("data:")
          ? user.avatar
          : user.profileImage;

      if (raw && raw.startsWith("data:")) {
        const base64Data = raw.includes(",") ? raw.split(",")[1] : raw;
        const buffer = Buffer.from(base64Data, "base64");
        newUrl = await uploadToCloudinary(buffer, "oict_avatars");
      }

      if (newUrl) {
        user.avatar = newUrl;
        user.profileImage = newUrl;
        await user.save();
        migrated++;
        console.log(`Updated user ${user._id} (${user.email}) -> ${newUrl}`);
      }
    } catch (err) {
      console.error(`Failed to migrate user ${user._id}:`, err.message);
    }
  }

  console.log(`Migration complete. Updated ${migrated} of ${users.length} users.`);
  await mongoose.disconnect();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
