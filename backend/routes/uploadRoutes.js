import express from "express";
import upload, { cloudifyUploads, uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Handle multipart uploads supporting common field names:
 * "image", "file", "screenshot", "avatar"
 */
const multiUpload = (req, res, next) => {
  const handler = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "screenshot", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]);

  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }

    // Normalize: pick the uploaded file from any standard field name
    req.file =
      req.files?.image?.[0] ||
      req.files?.file?.[0] ||
      req.files?.screenshot?.[0] ||
      req.files?.avatar?.[0] ||
      req.file;

    next();
  });
};

/**
 * POST /api/upload
 * Accessible by authenticated users (Sellers, Admins, Owners, Customers)
 */
router.post("/", protect, multiUpload, cloudifyUploads("oict_uploads"), async (req, res) => {
  // If file uploaded via multipart form data
  if (req.file) {
    const fileUrl =
      req.file.path || req.file.filename || req.file.secure_url || req.file.url;
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      image: fileUrl,
      imageUrl: fileUrl,
      url: fileUrl,
      filename: fileUrl,
      path: fileUrl,
    });
  }

  // Fallback for direct data URL / base64 or URL string in req.body
  const rawBodyImage = req.body?.image || req.body?.file || req.body?.imageUrl;
  if (rawBodyImage && typeof rawBodyImage === "string") {
    let resolvedUrl = rawBodyImage;
    if (resolvedUrl.startsWith("data:")) {
      try {
        resolvedUrl = await uploadToCloudinary(resolvedUrl, "oict_uploads", "upload.jpg");
      } catch (err) {
        console.warn("[uploadRoutes] Base64 upload fallback warning:", err.message);
      }
    }
    return res.status(200).json({
      success: true,
      message: "Image registered successfully",
      image: resolvedUrl,
      imageUrl: resolvedUrl,
      url: resolvedUrl,
      filename: resolvedUrl,
      path: resolvedUrl,
    });
  }

  return res.status(400).json({
    success: false,
    message: "No image file provided. Please select an image file to upload.",
  });
});

export default router;
