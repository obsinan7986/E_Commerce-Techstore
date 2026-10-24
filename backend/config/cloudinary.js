import { v2 as cloudinary } from "cloudinary";

/**
 * Validates whether Cloudinary is configured via environment variables.
 * Checks for individual API keys or CLOUDINARY_URL.
 * Rejects placeholder or empty values.
 */
export const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  const url = process.env.CLOUDINARY_URL?.trim();

  const hasValidKeys = Boolean(
    name &&
    key &&
    secret &&
    name !== "your_cloud_name" &&
    key !== "your_api_key" &&
    secret !== "your_api_secret"
  );

  const hasValidUrl = Boolean(
    url &&
    url.startsWith("cloudinary://") &&
    !url.includes("your_api_key")
  );

  return hasValidKeys || hasValidUrl;
};

/**
 * Applies Cloudinary configuration from environment variables if present.
 */
export const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) return false;

  const url = process.env.CLOUDINARY_URL?.trim();
  if (url && url.startsWith("cloudinary://")) {
    cloudinary.config({ cloudinary_url: url });
    return true;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key:    process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure:     true,
  });
  return true;
};

// Attempt initial configuration on boot
const isReady = configureCloudinary();
if (!isReady) {
  console.info(
    "[Cloudinary] Cloudinary keys not configured. Falling back to local disk storage (/uploads) for all file uploads."
  );
}

export const isConfigured = isReady;
export default cloudinary;
