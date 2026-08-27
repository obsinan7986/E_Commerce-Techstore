/**
 * Image Search Controller
 * POST /api/products/image-search
 *
 * Strategy:
 *  1. Extract keywords from the uploaded image filename and MIME type.
 *  2. Also check the file's MIME type to infer product category clues.
 *  3. Run a text search against product names, brands and categories
 *     using the extracted keywords — reusing the existing Product model.
 *  4. If no filename keywords match, return bestsellers / recent products
 *     as a useful fallback (still useful, no crash).
 *
 * Note: This is a keyword-based image search (no ML/vision API required).
 * For true visual similarity search, a vision API (Google Vision, AWS Rekognition)
 * would be needed — those require paid credentials not configured in this project.
 */
import path    from "path";
import Product from "../models/Product.js";
import fs      from "fs";

// ETB-approved image types
const ALLOWED_TYPES  = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Known category keywords from product filenames
const CATEGORY_HINTS = {
  "phone|iphone|samsung|galaxy|pixel|huawei|xiaomi|oppo|vivo|nokia|motorola": "Smartphones",
  "laptop|macbook|dell|hp|lenovo|asus|acer|notebook":                          "Laptops",
  "ipad|tablet":                                                                 "Tablets",
  "watch|smartwatch|garmin":                                                     "Smartwatches",
  "headphone|airpod|earphone|earbuds|buds|sennheiser":                          "Headphones",
  "speaker|jbl|marshall|bose|sony.*speaker":                                    "Speakers",
  "camera|canon|nikon|sony.*camera|fuji":                                       "Cameras",
  "tv|television|samsung.*tv|oled|qled":                                        "Televisions",
  "keyboard|mouse|charger|cable|hub|ssd|powerbank|headset|gaming|xbox|ps5":    "Accessories",
};

const inferKeywords = (filename, mimetype) => {
  const cleaned = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[-_\.]/g, " ");

  const words = cleaned.split(/\s+/).filter(w => w.length > 2);

  // Try to infer category from filename
  let inferredCategory = null;
  for (const [pattern, category] of Object.entries(CATEGORY_HINTS)) {
    if (new RegExp(pattern, "i").test(cleaned)) {
      inferredCategory = category;
      break;
    }
  }

  return { words, inferredCategory };
};

export const imageSearch = async (req, res) => {
  try {
    // ── Validate upload ───────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      // Delete uploaded file
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WEBP images are supported.",
      });
    }

    if (req.file.size > MAX_SIZE_BYTES) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Image must be under 5MB.",
      });
    }

    // ── Extract keywords from filename ────────────────────────
    const { words, inferredCategory } = inferKeywords(req.file.originalname, req.file.mimetype);

    // ── Clean up uploaded file (not stored — only used for keywords) ──
    fs.unlink(req.file.path, () => {});

    // ── Build search query ────────────────────────────────────
    const approvalFilter = {
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    };

    let products = [];

    if (inferredCategory) {
      // Primary: exact category match
      products = await Product.find({
        ...approvalFilter,
        category: inferredCategory,
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(12);
    }

    if (products.length < 6 && words.length > 0) {
      // Supplement with keyword text search
      const keywordRegexes = words
        .filter(w => w.length > 2)
        .slice(0, 4)
        .map(w => ({ $or: [
          { name:     { $regex: w, $options: "i" } },
          { brand:    { $regex: w, $options: "i" } },
          { category: { $regex: w, $options: "i" } },
        ] }));

      if (keywordRegexes.length > 0) {
        const keywordResults = await Product.find({
          ...approvalFilter,
          $or: keywordRegexes.flatMap(r => r.$or),
        })
          .sort({ rating: -1, numReviews: -1 })
          .limit(12);

        // Merge without duplicates
        const seen = new Set(products.map(p => p._id.toString()));
        for (const p of keywordResults) {
          if (!seen.has(p._id.toString())) {
            products.push(p);
            seen.add(p._id.toString());
          }
        }
      }
    }

    // ── Fallback: return top-rated products if no matches ─────
    if (products.length === 0) {
      products = await Product.find(approvalFilter)
        .sort({ rating: -1, numReviews: -1 })
        .limit(12);
    }

    res.status(200).json({
      success:  true,
      count:    products.length,
      query:    { words, inferredCategory },
      products: products.slice(0, 12),
    });

  } catch (err) {
    // Clean up file if still around
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: err.message });
  }
};
