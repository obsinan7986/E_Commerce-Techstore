import Coupon from "../models/Coupon.js";
import Order  from "../models/Order.js";
import User   from "../models/User.js";

const FIRST_ORDER_CODE = "FIRST10"; // auto-applied code name

/* ── Calculate discount amount ── */
const calcDiscount = (type, discount, subtotal) => {
  if (type === "percentage") return Math.round((subtotal * discount) / 100 * 100) / 100;
  if (type === "fixed")      return Math.min(discount, subtotal); // can't exceed subtotal
  return 0;
};

// ─────────────────────────────────────────────────────────────────
// POST /api/coupons/apply  (protected — customer)
// Validates coupon and returns discount info WITHOUT committing
// ─────────────────────────────────────────────────────────────────
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a coupon code." });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "This coupon is inactive." });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired." });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "This coupon has reached its usage limit." });
    }

    // Per-user usage check
    if (coupon.usedBy.some((uid) => uid.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: "You have already used this coupon." });
    }

    // First-order-only check
    if (coupon.isFirstOrderOnly) {
      const hasOrder = await Order.exists({
        user:        req.user._id,
        orderStatus: { $ne: "Cancelled" },
      });
      if (hasOrder) {
        return res.status(400).json({ success: false, message: "This coupon is only valid on your first order." });
      }
    }

    // Minimum order amount check
    const sub = Number(subtotal) || 0;
    if (coupon.minOrderAmount > 0 && sub < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ETB ${coupon.minOrderAmount.toLocaleString()} required for this coupon.`,
      });
    }

    const discountAmount = calcDiscount(coupon.type, coupon.discount, sub);
    const finalPrice     = Math.max(0, sub - discountAmount);

    return res.status(200).json({
      success: true,
      code:           coupon.code,
      type:           coupon.type,
      discount:       coupon.discount,
      discountAmount,
      finalPrice,
      description:    coupon.description,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/coupons/first-order-check  (protected — customer)
// Returns whether the user qualifies for the first-order discount
// ─────────────────────────────────────────────────────────────────
export const checkFirstOrderDiscount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.firstOrderDiscountUsed) {
      return res.status(200).json({ eligible: false });
    }
    const hasOrder = await Order.exists({
      user:        req.user._id,
      orderStatus: { $ne: "Cancelled" },
    });
    return res.status(200).json({ eligible: !hasOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/coupons  (admin)
// ─────────────────────────────────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    const {
      code, description = "", type = "percentage",
      discount, minOrderAmount = 0, expiresAt,
      usageLimit = 0, isFirstOrderOnly = false,
    } = req.body;

    if (!code?.trim() || !discount || !expiresAt) {
      return res.status(400).json({ success: false, message: "code, discount and expiresAt are required." });
    }

    if (type === "percentage" && (discount < 1 || discount > 100)) {
      return res.status(400).json({ success: false, message: "Percentage discount must be between 1 and 100." });
    }

    if (type === "fixed" && discount < 1) {
      return res.status(400).json({ success: false, message: "Fixed discount must be at least 1 ETB." });
    }

    const exists = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (exists) return res.status(400).json({ success: false, message: "A coupon with this code already exists." });

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description: description.trim(),
      type,
      discount: Number(discount),
      minOrderAmount: Number(minOrderAmount),
      expiresAt: new Date(expiresAt),
      usageLimit: Number(usageLimit),
      isFirstOrderOnly: Boolean(isFirstOrderOnly),
    });

    return res.status(201).json({ success: true, message: "Coupon created.", coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Coupon code already exists." });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/coupons  (admin)
// ─────────────────────────────────────────────────────────────────
export const getCoupons = async (req, res) => {
  try {
    const keyword = (req.query.keyword || "").trim();
    const filter  = keyword
      ? { code: { $regex: keyword, $options: "i" } }
      : {};
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/coupons/:id  (admin)
// ─────────────────────────────────────────────────────────────────
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    return res.status(200).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/coupons/:id  (admin)
// ─────────────────────────────────────────────────────────────────
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });

    const {
      description, type, discount, minOrderAmount,
      expiresAt, usageLimit, isFirstOrderOnly, isActive,
    } = req.body;

    if (description  !== undefined) coupon.description      = description.trim();
    if (type         !== undefined) coupon.type             = type;
    if (discount     !== undefined) coupon.discount         = Number(discount);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
    if (expiresAt    !== undefined) coupon.expiresAt        = new Date(expiresAt);
    if (usageLimit   !== undefined) coupon.usageLimit       = Number(usageLimit);
    if (isFirstOrderOnly !== undefined) coupon.isFirstOrderOnly = Boolean(isFirstOrderOnly);
    if (isActive     !== undefined) coupon.isActive         = Boolean(isActive);

    await coupon.save();
    return res.status(200).json({ success: true, message: "Coupon updated.", coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/coupons/:id  (admin)
// ─────────────────────────────────────────────────────────────────
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    return res.status(200).json({ success: true, message: "Coupon deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
