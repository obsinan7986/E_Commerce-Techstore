/**
 * Promote a user to the "owner" role by email.
 *
 * Usage:
 *   node scripts/makeOwner.js your@email.com
 */
import dotenv   from "dotenv";
import path     from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User     from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/makeOwner.js your@email.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.error(`No user found with email: ${email}`);
  await mongoose.disconnect();
  process.exit(1);
}

user.role    = "owner";
user.isAdmin = true;
await user.save();

console.log(`✅  ${user.fullName} (${user.email}) is now an Owner.`);
await mongoose.disconnect();
