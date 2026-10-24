import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cloudinary, { isCloudinaryConfigured, configureCloudinary } from "../config/cloudinary.js";

// ── Resolve upload directory ──────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadDir = path.resolve(__dirname, "../uploads");

// Ensure upload folder exists on startup
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Upload] Created local uploads directory at: ${uploadDir}`);
  } catch (err) {
    console.error(`[Upload] Failed to initialize upload folder at ${uploadDir}:`, err.message);
  }
}

// In-memory storage for Cloudinary streaming and resilient local fallback
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
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Saves a buffer directly to local disk storage (/uploads)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name for extension and name slug
 * @returns {Promise<string>} - Resolves to relative URL path e.g. "/uploads/screenshot-123456789.png"
 */
export const saveBufferLocally = async (buffer, originalname = "upload.jpg") => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const rawExt = path.extname(originalname || "").toLowerCase();
  const ext = rawExt && ALLOWED_EXT_REGEX.test(rawExt) ? rawExt : ".jpg";
  const rawBase = path
    .basename(originalname || "upload", rawExt)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .substring(0, 50);
  const base = rawBase || "file";
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${base}-${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, filename);

  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${filename}`;
};

/**
 * Uploads a buffer directly to Cloudinary using upload_stream,
 * or falls back to local disk storage (/uploads) if Cloudinary keys are missing or upload fails.
 * @param {Buffer|string} bufferOrData - Buffer, base64 data string, or file path
 * @param {string} folder - Cloudinary folder name
 * @param {string} originalname - Original file name (used for local fallback)
 * @returns {Promise<string>} - Resolves to Cloudinary secure_url or local /uploads/... path
 */
export const uploadToCloudinary = async (
  bufferOrData,
  folder = "oict_uploads",
  originalname = "upload.jpg"
) => {
  if (!bufferOrData) {
    throw new Error("No file content provided for upload.");
  }

  // If already a hosted URL or relative uploads path, return as is
  if (
    typeof bufferOrData === "string" &&
    (bufferOrData.startsWith("http://") ||
      bufferOrData.startsWith("https://") ||
      bufferOrData.startsWith("/uploads/"))
  ) {
    return bufferOrData;
  }

  // Convert string (base64 data URI or file path) to Buffer
  let buffer;
  if (Buffer.isBuffer(bufferOrData)) {
    buffer = bufferOrData;
  } else if (typeof bufferOrData === "string") {
    if (bufferOrData.startsWith("data:")) {
      const parts = bufferOrData.split(",");
      const base64Data = parts.length > 1 ? parts[1] : parts[0];
      buffer = Buffer.from(base64Data, "base64");
    } else if (fs.existsSync(bufferOrData)) {
      buffer = await fs.promises.readFile(bufferOrData);
      originalname = path.basename(bufferOrData);
    } else {
      buffer = Buffer.from(bufferOrData);
    }
  } else {
    throw new Error("Invalid buffer or file provided for upload.");
  }

  // If Cloudinary is configured, attempt upload to cloud
  if (isCloudinaryConfigured()) {
    try {
      configureCloudinary();
      const secureUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
      return secureUrl;
    } catch (cloudErr) {
      console.warn(
        `[Cloudinary] Cloud upload failed (${cloudErr.message}). Falling back to local disk storage.`
      );
      return await saveBufferLocally(buffer, originalname);
    }
  }

  // Robust fallback to local disk storage
  return await saveBufferLocally(buffer, originalname);
};

/**
 * Middleware that runs after multer.
 * Uploads req.file and every file in req.files to Cloudinary if configured,
 * or saves to local disk storage (/uploads) if Cloudinary keys are missing or fail.
 * Sets file.path, file.filename, file.secure_url, and file.url to the resulting path/URL.
 */
export const cloudifyUploads =
  (folder = "oict_uploads") =>
  async (req, res, next) => {
    try {
      const filesToUpload = [];

      if (req.file && (req.file.buffer || req.file.path)) {
        filesToUpload.push(req.file);
      }

      if (req.files) {
        if (Array.isArray(req.files)) {
          for (const file of req.files) {
            if (file && (file.buffer || file.path)) filesToUpload.push(file);
          }
        } else if (typeof req.files === "object") {
          for (const key of Object.keys(req.files)) {
            const arr = req.files[key];
            if (Array.isArray(arr)) {
              for (const file of arr) {
                if (file && (file.buffer || file.path)) filesToUpload.push(file);
              }
            }
          }
        }
      }

      if (filesToUpload.length === 0) {
        return next();
      }

      await Promise.all(
        filesToUpload.map(async (file) => {
          const buf =
            file.buffer ||
            (file.path && fs.existsSync(file.path)
              ? await fs.promises.readFile(file.path)
              : null);
          if (!buf) return;

          const uploadedUrl = await uploadToCloudinary(
            buf,
            folder,
            file.originalname
          );
          file.path = uploadedUrl;
          file.filename = uploadedUrl;
          file.secure_url = uploadedUrl;
          file.url = uploadedUrl;
        })
      );

      next();
    } catch (error) {
      console.error("[Upload Middleware Error]:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process image upload",
      });
    }
  };

export default upload;
