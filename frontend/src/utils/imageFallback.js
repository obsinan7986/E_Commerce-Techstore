/**
 * Global Image Fallback Utilities
 * Provides zero-dependency SVG data URI placeholders for products,
 * avatars, KYC identity documents, and payment receipts.
 */
import { BASE_URL } from "../services/api";

export const PRODUCT_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none">
      <rect width="240" height="240" rx="12" fill="#F1F5F9"/>
      <path d="M70 90h100l-12 85H82L70 90z" stroke="#94A3B8" stroke-width="6" stroke-linejoin="round" fill="#E2E8F0"/>
      <path d="M95 90V75a25 25 0 0150 0v15" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
      <circle cx="120" cy="132" r="14" fill="#3B82F6"/>
      <text x="120" y="205" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto" font-size="13" font-weight="600" fill="#64748B">OICT_TechStore</text>
    </svg>`
  );

export const AVATAR_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" rx="60" fill="#E2E8F0"/>
      <circle cx="60" cy="48" r="22" fill="#94A3B8"/>
      <path d="M26 104c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="#94A3B8"/>
    </svg>`
  );

export const DOCUMENT_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160" fill="none">
      <rect width="240" height="160" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
      <rect x="24" y="24" width="60" height="70" rx="6" fill="#E2E8F0"/>
      <circle cx="54" cy="52" r="14" fill="#94A3B8"/>
      <path d="M36 84c0-9.941 8.059-18 18-18s18 8.059 18 18" fill="#94A3B8"/>
      <rect x="100" y="32" width="116" height="10" rx="3" fill="#94A3B8"/>
      <rect x="100" y="52" width="90" height="8" rx="3" fill="#CBD5E1"/>
      <rect x="100" y="68" width="105" height="8" rx="3" fill="#CBD5E1"/>
      <rect x="24" y="112" width="192" height="24" rx="4" fill="#E2E8F0"/>
      <text x="120" y="128" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto" font-size="11" font-weight="600" fill="#64748B">ID / KYC DOCUMENT</text>
    </svg>`
  );

export const RECEIPT_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 0 200 240" fill="none">
      <rect width="200" height="240" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
      <path d="M40 40h120M40 70h120M40 100h80M40 130h100M40 160h60" stroke="#CBD5E1" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="195" r="20" fill="#DCFCE7" stroke="#16A34A" stroke-width="2"/>
      <path d="M92 195l6 6 12-12" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="100" y="230" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto" font-size="10.5" font-weight="700" fill="#047857">RECEIPT VERIFIED</text>
    </svg>`
  );

/**
 * Standard image onError handler.
 * Prevents infinite loop and applies appropriate SVG placeholder.
 */
export const handleImageError = (e, type = "product") => {
  if (!e?.currentTarget) return;
  e.currentTarget.onerror = null;

  switch (type) {
    case "avatar":
    case "user":
    case "profile":
      e.currentTarget.src = AVATAR_FALLBACK_SVG;
      break;
    case "document":
    case "kyc":
    case "id":
      e.currentTarget.src = DOCUMENT_FALLBACK_SVG;
      break;
    case "receipt":
    case "screenshot":
    case "payment":
      e.currentTarget.src = RECEIPT_FALLBACK_SVG;
      break;
    case "product":
    default:
      e.currentTarget.src = PRODUCT_FALLBACK_SVG;
      break;
  }
};

/**
 * Safe image URL resolver.
 * Ensures relative `/uploads/...` paths are prefixed with BASE_URL.
 */
export const resolveImageUrl = (path, type = "product") => {
  if (!path) {
    switch (type) {
      case "avatar": return AVATAR_FALLBACK_SVG;
      case "document": return DOCUMENT_FALLBACK_SVG;
      case "receipt": return RECEIPT_FALLBACK_SVG;
      default: return PRODUCT_FALLBACK_SVG;
    }
  }
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Optimizes Cloudinary image URLs by inserting transformation parameters (e.g. f_auto,q_auto,w_600)
 */
export const optimizeCloudinaryUrl = (url, transform = "f_auto,q_auto,w_600") => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (url.includes(`/upload/${transform}/`)) return url;
    return url.replace("/upload/", `/upload/${transform}/`);
  }
  return url;
};

export default handleImageError;
