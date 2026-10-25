/**
 * Migration Script: migrateLocalUploadsToCloudinary.js
 *
 * Scans local "/uploads/<file>" references across:
 *  - Product.image
 *  - User.avatar, User.profileImage, User.kycDocs.*
 *  - Banner.image
 *  - PaymentSettings.bankQrCode
 *  - Order.manualPayment.screenshotUrl / Order.receiptImage
 *
 * Uploads existing local files to Cloudinary and replaces DB paths with secure_url.
 *
 * Usage:
 *   node backend/scripts/migrateLocalUploadsToCloudinary.js          (Dry-run)
 *   node backend/scripts/migrateLocalUploadsToCloudinary.js --apply  (Write to DB)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

// ESM-safe paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

import cloudinary, { isCloudinaryConfigured, configureCloudinary } from "../config/cloudinary.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Banner from "../models/Banner.js";
import PaymentSettings from "../models/PaymentSettings.js";
import Order from "../models/Order.js";

const uploadsDir = path.resolve(__dirname, "../uploads");

// 1. Refuse to run without Cloudinary keys
if (!isCloudinaryConfigured()) {
  console.error("❌ Refusing to run: Cloudinary keys are not configured in environment.");
  console.error("   Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.");
  process.exit(1);
}

configureCloudinary();

const isApply = process.argv.includes("--apply");

console.log("==========================================================");
console.log("  Local Uploads to Cloudinary Migration Tool");
console.log("==========================================================");
if (!isApply) {
  console.log("MODE: [DRY-RUN] No changes will be written to MongoDB.");
  console.log("      Run with '--apply' to upload and update database.\n");
} else {
  console.log("MODE: [APPLY] Files will be uploaded to Cloudinary and DB will be updated.\n");
}

const stats = {
  products:        { migrated: 0, alreadyCloud: 0, fileMissing: 0, empty: 0 },
  users:           { migrated: 0, alreadyCloud: 0, fileMissing: 0, empty: 0 },
  banners:         { migrated: 0, alreadyCloud: 0, fileMissing: 0, empty: 0 },
  paymentSettings: { migrated: 0, alreadyCloud: 0, fileMissing: 0, empty: 0 },
  orders:          { migrated: 0, alreadyCloud: 0, fileMissing: 0, empty: 0 },
};

/**
 * Upload buffer to Cloudinary
 */
const uploadBuffer = async (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: path.basename(filename, path.extname(filename)),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Inspect a path and optionally upload
 */
const processImagePath = async (imageVal, folder, entityStats) => {
  if (!imageVal || typeof imageVal !== "string" || !imageVal.trim()) {
    entityStats.empty++;
    return null;
  }

  const trimmed = imageVal.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    entityStats.alreadyCloud++;
    return null;
  }

  if (trimmed.startsWith("/uploads/")) {
    const filename = trimmed.replace(/^\/uploads\/?/, "");
    const localFilePath = path.join(uploadsDir, filename);

    if (fs.existsSync(localFilePath)) {
      if (isApply) {
        try {
          const buffer = await fs.promises.readFile(localFilePath);
          const secureUrl = await uploadBuffer(buffer, folder, filename);
          entityStats.migrated++;
          return secureUrl;
        } catch (err) {
          console.error(`   Failed to upload ${filename}: ${err.message}`);
          entityStats.fileMissing++;
          return null;
        }
      } else {
        entityStats.migrated++;
        return `(dry-run: would upload ${filename})`;
      }
    } else {
      entityStats.fileMissing++;
      return null;
    }
  }

  entityStats.empty++;
  return null;
};

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI is missing in environment.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ Connected to database: ${conn.connection.name}\n`);

    // 1. Scan Products
    console.log("Scanning Products...");
    const products = await Product.find({});
    for (const prod of products) {
      const newUrl = await processImagePath(prod.image, "oict_products", stats.products);
      if (isApply && newUrl && newUrl.startsWith("http")) {
        prod.image = newUrl;
        await prod.save();
      }
    }

    // 2. Scan Users
    console.log("Scanning Users...");
    const users = await User.find({});
    for (const u of users) {
      let changed = false;

      // avatar
      const newAvatar = await processImagePath(u.avatar, "oict_avatars", stats.users);
      if (isApply && newAvatar && newAvatar.startsWith("http")) {
        u.avatar = newAvatar;
        changed = true;
      }

      // profileImage
      const newProfile = await processImagePath(u.profileImage, "oict_avatars", stats.users);
      if (isApply && newProfile && newProfile.startsWith("http")) {
        u.profileImage = newProfile;
        changed = true;
      }

      // kycDocs
      if (u.kycDocs) {
        if (u.kycDocs.idFront) {
          const newFront = await processImagePath(u.kycDocs.idFront, "oict_kyc", stats.users);
          if (isApply && newFront && newFront.startsWith("http")) {
            u.kycDocs.idFront = newFront;
            changed = true;
          }
        }
        if (u.kycDocs.idBack) {
          const newBack = await processImagePath(u.kycDocs.idBack, "oict_kyc", stats.users);
          if (isApply && newBack && newBack.startsWith("http")) {
            u.kycDocs.idBack = newBack;
            changed = true;
          }
        }
      }

      // idBackImage
      if (u.idBackImage) {
        const newBackImg = await processImagePath(u.idBackImage, "oict_kyc", stats.users);
        if (isApply && newBackImg && newBackImg.startsWith("http")) {
          u.idBackImage = newBackImg;
          changed = true;
        }
      }

      if (isApply && changed) {
        await u.save();
      }
    }

    // 3. Scan Banners
    console.log("Scanning Banners...");
    const banners = await Banner.find({});
    for (const b of banners) {
      const newBanner = await processImagePath(b.image, "oict_banners", stats.banners);
      if (isApply && newBanner && newBanner.startsWith("http")) {
        b.image = newBanner;
        await b.save();
      }
    }

    // 4. Scan PaymentSettings
    console.log("Scanning PaymentSettings...");
    const settingsList = await PaymentSettings.find({});
    for (const s of settingsList) {
      if (s.bankQrCode) {
        const newQr = await processImagePath(s.bankQrCode, "oict_settings", stats.paymentSettings);
        if (isApply && newQr && newQr.startsWith("http")) {
          s.bankQrCode = newQr;
          await s.save();
        }
      }
    }

    // 5. Scan Orders (manualPayment screenshots)
    console.log("Scanning Orders...");
    const orders = await Order.find({
      $or: [
        { "manualPayment.screenshotUrl": { $exists: true, $ne: "" } },
        { receiptImage: { $exists: true, $ne: "" } },
      ],
    });
    for (const o of orders) {
      let orderChanged = false;
      const currentScreenshot = o.manualPayment?.screenshotUrl || o.receiptImage;
      const newScreenshot = await processImagePath(currentScreenshot, "oict_screenshots", stats.orders);
      if (isApply && newScreenshot && newScreenshot.startsWith("http")) {
        if (!o.manualPayment) o.manualPayment = {};
        o.manualPayment.screenshotUrl = newScreenshot;
        o.receiptImage = newScreenshot;
        orderChanged = true;
      }
      if (isApply && orderChanged) {
        await o.save();
      }
    }

    // Print Summary
    console.log("\n==========================================================");
    console.log("  MIGRATION SUMMARY " + (isApply ? "(APPLIED)" : "(DRY-RUN)"));
    console.log("==========================================================");

    const categories = [
      { name: "Products", stats: stats.products },
      { name: "Users (Avatars & KYC)", stats: stats.users },
      { name: "Banners", stats: stats.banners },
      { name: "Payment Settings", stats: stats.paymentSettings },
      { name: "Orders (Screenshots)", stats: stats.orders },
    ];

    let totalMigrated = 0;
    let totalAlreadyCloud = 0;
    let totalFileMissing = 0;

    for (const cat of categories) {
      console.log(`\n▶ ${cat.name}:`);
      console.log(`   - ${isApply ? "Migrated to Cloudinary" : "Would Migrate"} : ${cat.stats.migrated}`);
      console.log(`   - Already Cloud (HTTPS)       : ${cat.stats.alreadyCloud}`);
      console.log(`   - File Missing in /uploads   : ${cat.stats.fileMissing}`);

      totalMigrated += cat.stats.migrated;
      totalAlreadyCloud += cat.stats.alreadyCloud;
      totalFileMissing += cat.stats.fileMissing;
    }

    console.log("\n----------------------------------------------------------");
    console.log(`TOTAL ${isApply ? "MIGRATED" : "PENDING MIGRATION"} : ${totalMigrated}`);
    console.log(`TOTAL ALREADY CLOUD     : ${totalAlreadyCloud}`);
    console.log(`TOTAL FILES MISSING     : ${totalFileMissing}`);
    console.log("----------------------------------------------------------");
    console.log("Note: Local files in backend/uploads were preserved and not deleted.\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
};

runMigration();
