import express from "express";
import upload, { cloudifyUploads } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Handle multipart uploads supporting both "image" and "file" field names
 */
const multiUpload = (req, res, next) => {
  const handler = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]);

  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }

    // Normalize: pick the uploaded file from either "image" or "file" field
    req.file = req.files?.image?.[0] || req.files?.file?.[0] || req.file;
    next();
  });
};

/**
 * POST /api/upload
 * Accessible by authenticated users (Sellers, Admins, Owners, Customers)
 */
router.post("/", protect, multiUpload, cloudifyUploads("oict_uploads"), (req, res) => {
  // If file uploaded via multipart form data
  if (req.file) {
    const secureUrl = req.file.path || req.file.filename;
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      image: secureUrl,
      filename: secureUrl,
    });
  }

  // Fallback for direct data URL / base64 or URL string in req.body
  if (req.body?.image && typeof req.body.image === "string") {
    return res.status(200).json({
      success: true,
      message: "Image registered successfully",
      image: req.body.image,
      filename: req.body.image,
    });
  }

  return res.status(400).json({
    success: false,
    message: "No image file provided. Please select an image file to upload.",
  });
});

export default router;
