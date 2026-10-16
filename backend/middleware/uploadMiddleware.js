import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists automatically
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Allowed extensions and MIME types
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

// File filter supporting standard, modern, and camera image formats
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
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
});

export default upload;