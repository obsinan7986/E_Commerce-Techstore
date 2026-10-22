import multer from "multer";
import path from "path";
import cloudinary, { isConfigured } from "../config/cloudinary.js";

// In-memory storage for Cloudinary upload streaming
const storage = multer.memoryStorage();

// Allowed extensions and MIME types (images + PDF for KYC)
const ALLOWED_EXT_REGEX = /\.(jpe?g|png|webp|gif|svg|avif|jfif|bmp|pdf)$/i;
const ALLOWED_MIME_LIST = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/jfif",
  "image/pjpeg",
  "image/bmp",
  "image/x-ms-bmp",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const isExtAllowed = ALLOWED_EXT_REGEX.test(ext);
  const isMimeAllowed =
    (file.mimetype && file.mimetype.startsWith("image/")) ||
    ALLOWED_MIME_LIST.includes(file.mimetype);

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only valid image files (.jpg, .jpeg, .png, .webp, .gif, .svg, .avif, .jfif, .bmp) or PDFs are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Uploads a buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} - Resolves to secure_url
 */
export const uploadToCloudinary = (buffer, folder = "oict_uploads") => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error("Image storage is not configured"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Middleware that runs after multer.
 * Uploads req.file and every file in req.files to Cloudinary.
 * Sets file.path = secure_url and file.filename = secure_url.
 */
export const cloudifyUploads = (folder = "oict_uploads") => async (req, res, next) => {
  try {
    const filesToUpload = [];

    if (req.file && req.file.buffer) {
      filesToUpload.push(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file && file.buffer) filesToUpload.push(file);
        }
      } else if (typeof req.files === "object") {
        for (const key of Object.keys(req.files)) {
          const arr = req.files[key];
          if (Array.isArray(arr)) {
            for (const file of arr) {
              if (file && file.buffer) filesToUpload.push(file);
            }
          }
        }
      }
    }

    if (filesToUpload.length === 0) {
      return next();
    }

    if (!isConfigured) {
      return res.status(500).json({
        success: false,
        message: "Image storage is not configured",
      });
    }

    await Promise.all(
      filesToUpload.map(async (file) => {
        const secureUrl = await uploadToCloudinary(file.buffer, folder);
        file.path = secureUrl;
        file.filename = secureUrl;
        file.secure_url = secureUrl;
      })
    );

    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    if (error.message === "Image storage is not configured") {
      return res.status(500).json({
        success: false,
        message: "Image storage is not configured",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image to cloud storage",
    });
  }
};

export default upload;
