import Banner from "../models/Banner.js";

// ======================================
// PUBLIC — Get active banners for homepage slider
// GET /api/banners
// Returns only banners that are active AND within their date window
// ======================================
export const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive:  true,
      startDate: { $lte: now },
      endDate:   { $gte: now },
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// ADMIN — Get all banners (including inactive / expired)
// GET /api/admin/banners
// ======================================
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({ success: true, count: banners.length, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// ADMIN — Create banner
// POST /api/admin/banners
// Body: { title, subtitle, image, productLink, startDate, endDate, isActive, sortOrder }
// ======================================
export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, image, productLink, startDate, endDate, isActive, sortOrder } = req.body;

    if (!title || !image || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "title, image, startDate and endDate are required.",
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "endDate must be after startDate.",
      });
    }

    const banner = await Banner.create({
      title,
      subtitle:    subtitle    ?? "",
      image,
      productLink: productLink ?? "/products",
      startDate:   new Date(startDate),
      endDate:     new Date(endDate),
      isActive:    isActive    ?? true,
      sortOrder:   sortOrder   ?? 0,
    });

    res.status(201).json({ success: true, message: "Banner created.", banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// ADMIN — Update banner
// PUT /api/admin/banners/:id
// ======================================
export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    const { title, subtitle, image, productLink, startDate, endDate, isActive, sortOrder } = req.body;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "endDate must be after startDate.",
      });
    }

    if (title        !== undefined) banner.title       = title;
    if (subtitle     !== undefined) banner.subtitle    = subtitle;
    if (image        !== undefined) banner.image       = image;
    if (productLink  !== undefined) banner.productLink = productLink;
    if (startDate    !== undefined) banner.startDate   = new Date(startDate);
    if (endDate      !== undefined) banner.endDate     = new Date(endDate);
    if (isActive     !== undefined) banner.isActive    = isActive;
    if (sortOrder    !== undefined) banner.sortOrder   = sortOrder;

    await banner.save();
    res.status(200).json({ success: true, message: "Banner updated.", banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// ADMIN — Delete banner
// DELETE /api/admin/banners/:id
// ======================================
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    await banner.deleteOne();
    res.status(200).json({ success: true, message: "Banner deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// ADMIN — Toggle isActive
// PATCH /api/admin/banners/:id/toggle
// ======================================
export const toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"}.`,
      banner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
