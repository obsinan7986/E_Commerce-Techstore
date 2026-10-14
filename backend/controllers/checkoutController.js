import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import PaymentSettings from "../models/PaymentSettings.js";
import { calculateItemCommission } from "../utils/commissionEngine.js";

export const checkout = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      city,
      subCity,
      address,
      paymentMethod,
    } = req.body;

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate({
      path: "items.product",
      populate: { path: "seller", select: "commissionAgreement role" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate every product before creating the order
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(404).json({
          success: false,
          message: "A product in the cart no longer exists.",
        });
      }

      if (!item.product.image) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product.name}" has no image. Please update the product first.`,
        });
      }
    }

    const paymentSettings = await PaymentSettings.findOne();

    const orderItems = cart.items.map((item) => {
      const p = item.product;
      const seller = p?.seller;
      const calc = calculateItemCommission(item, p, seller, paymentSettings);

      return {
        product: p._id,
        name: p.name,
        image: p.image,
        quantity: item.quantity,
        price: p.price,
        seller: seller?._id || seller || null,
        grossItemTotal: calc.grossItemTotal,
        commissionRateApplied: calc.rate,
        commissionDebited: calc.commissionDebited,
        sellerNetEarning: calc.sellerNetEarning,
      };
    });

    const totalGrossItemsPrice = orderItems.reduce(
      (acc, item) => acc + (item.grossItemTotal || item.price * item.quantity),
      0
    );
    const totalCommissionDebited = orderItems.reduce(
      (acc, item) => acc + (item.commissionDebited || 0),
      0
    );
    const totalSellerNetPayout = orderItems.reduce(
      (acc, item) => acc + (item.sellerNetEarning || 0),
      0
    );

    const itemsPrice = totalGrossItemsPrice;
    const shippingPrice = 100;
    const taxPrice = itemsPrice * 0.15;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        fullName,
        phone,
        city,
        subCity,
        address,
      },
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      totalGrossItemsPrice,
      totalCommissionDebited,
      totalSellerNetPayout,
      isCommissionSettled: false,
    });

    // Add pending earnings to sellers
    for (const item of orderItems) {
      if (item.seller && item.sellerNetEarning > 0) {
        await User.findByIdAndUpdate(item.seller, {
          $inc: { pendingSellerCredits: item.sellerNetEarning },
        });
      }
    }

    res.status(201).json({
      success: true,
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};