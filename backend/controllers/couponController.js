import Coupon from "../models/Coupon.js";

// ======================================
// Create Coupon (Admin)
// ======================================
export const createCoupon = async (req, res) => {
  try {
    const { code, discount, expiresAt } = req.body;

    if (!code || !discount || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields.",
      });
    }

    const exists = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists.",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discount,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ======================================
// Get All Coupons
// ======================================
export const getCoupons = async (req, res) => {
  try {

    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: coupons.length,
      coupons,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ======================================
// Apply Coupon
// ======================================
export const applyCoupon = async (req, res) => {
  try {

    const { code, totalPrice } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Coupon is inactive.",
      });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired.",
      });
    }

    const discountAmount =
      (Number(totalPrice) * coupon.discount) / 100;

    const finalPrice =
      Number(totalPrice) - discountAmount;

    res.json({
      success: true,
      coupon: coupon.code,
      discount: coupon.discount,
      discountAmount,
      finalPrice,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};