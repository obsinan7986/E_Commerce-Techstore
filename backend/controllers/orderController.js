import Order   from "../models/Order.js";
import Cart    from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon  from "../models/Coupon.js";
import User    from "../models/User.js";
import createNotification      from "../utils/createNotification.js";
import createAdminNotification from "../utils/createAdminNotification.js";
import { sendTemplate }   from "../utils/emailService.js";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
} from "../utils/emailTemplates.js";

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      couponCode,          // optional coupon
      useFirstOrderDiscount, // optional boolean
    } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    if (!shippingAddress.fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!shippingAddress.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (!shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: "Address is required.",
      });
    }

    if (!shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    // Validate payment method
    const allowedPaymentMethods = [
      "Chapa",
      "CBE Birr",
      "Telebirr",
      "M-Pesa",
      "Awash Bank",
      "Cash On Delivery",
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    // Check cart
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Check stock
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists.",
        });
      }

      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} is out of stock.`,
        });
      }
    }

    // Build order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      price: item.product.price,
    }));

    // ── Pricing ──────────────────────────────────────────────────
    const itemsPrice    = orderItems.reduce((t, i) => t + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice >= 5000 ? 0 : 200;
    const taxPrice      = itemsPrice * 0.15;
    const preTaxSubtotal = itemsPrice + shippingPrice;

    // ── Coupon / First-order discount ─────────────────────────────
    let discountAmount = 0;
    let couponDoc      = null;
    let couponSnapshot = { code: "", type: "", discount: 0, discountAmount: 0 };

    // 10% first-order discount
    if (useFirstOrderDiscount) {
      const dbUser   = await User.findById(req.user._id);
      const hasOrder = await Order.exists({ user: req.user._id, orderStatus: { $ne: "Cancelled" } });
      if (!dbUser.firstOrderDiscountUsed && !hasOrder) {
        discountAmount = Math.round(preTaxSubtotal * 0.10 * 100) / 100;
        couponSnapshot = { code: "FIRST10", type: "percentage", discount: 10, discountAmount };
      }
    }

    // Named coupon (takes precedence over first-order if both sent)
    if (couponCode?.trim()) {
      couponDoc = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });

      if (!couponDoc)                            throw { status: 400, message: "Coupon not found." };
      if (!couponDoc.isActive)                   throw { status: 400, message: "This coupon is inactive." };
      if (couponDoc.expiresAt < new Date())       throw { status: 400, message: "This coupon has expired." };
      if (couponDoc.usageLimit > 0 && couponDoc.usedCount >= couponDoc.usageLimit)
        throw { status: 400, message: "This coupon has reached its usage limit." };
      if (couponDoc.usedBy.some((u) => u.toString() === req.user._id.toString()))
        throw { status: 400, message: "You have already used this coupon." };
      if (couponDoc.isFirstOrderOnly) {
        const hasOrder = await Order.exists({ user: req.user._id, orderStatus: { $ne: "Cancelled" } });
        if (hasOrder) throw { status: 400, message: "This coupon is only valid on your first order." };
      }
      if (couponDoc.minOrderAmount > 0 && preTaxSubtotal < couponDoc.minOrderAmount)
        throw { status: 400, message: `Minimum order of ETB ${couponDoc.minOrderAmount.toLocaleString()} required.` };

      if (couponDoc.type === "percentage") {
        discountAmount = Math.round(preTaxSubtotal * couponDoc.discount / 100 * 100) / 100;
      } else {
        discountAmount = Math.min(couponDoc.discount, preTaxSubtotal);
      }
      couponSnapshot = {
        code:           couponDoc.code,
        type:           couponDoc.type,
        discount:       couponDoc.discount,
        discountAmount,
      };
    }

    const totalPrice = Math.max(0, itemsPrice + shippingPrice + taxPrice - discountAmount);

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone:    shippingAddress.phone,
        city:     shippingAddress.city,
        subCity:  shippingAddress.subCity || "",
        address:  shippingAddress.address,
      },
      paymentMethod,
      paymentStatus: "Pending",
      isPaid:        false,
      orderStatus:   "Pending",
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      coupon: couponSnapshot,
    });

    // ── Commit coupon usage ───────────────────────────────────────
    if (couponDoc) {
      couponDoc.usedCount += 1;
      couponDoc.usedBy.push(req.user._id);
      await couponDoc.save();
    }
    if (useFirstOrderDiscount && couponSnapshot.code === "FIRST10") {
      await User.findByIdAndUpdate(req.user._id, { firstOrderDiscountUsed: true });
    }

  // Reduce stock only when the order is created.
// The order now owns the purchased quantities.
   for (const item of cart.items) {
     item.product.stock -= item.quantity;
     await item.product.save();
  }

// Clear cart only for Cash On Delivery.
// Online payments clear the cart after successful payment.
    if (paymentMethod === "Cash On Delivery") {
      cart.items = [];
      await cart.save();
    }

    // Notify user about order placement
    await createNotification({
      userId:  req.user._id,
      type:    "order_placed",
      title:   "Order Placed Successfully",
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed. Total: ETB ${order.totalPrice.toLocaleString()}.`,
      link:    `/orders/${order._id}`,
    });

    // Notify admins of new order (fire-and-forget)
    createAdminNotification({
      type:    "admin_new_order",
      title:   "New Order Received",
      message: `Order #${order._id.toString().slice(-8).toUpperCase()} — ETB ${order.totalPrice.toLocaleString()} via ${order.paymentMethod}.`,
      link:    "/admin/orders",
    }).catch(() => {});

    // Send order confirmation email (fire-and-forget)
    const orderUser = await User.findById(req.user._id).select("fullName email");
    if (orderUser?.email) {
      sendTemplate(orderUser.email, orderConfirmationEmail({
        fullName:    orderUser.fullName,
        order,
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        baseUrl:     process.env.BACKEND_URL  || "http://localhost:5000",
      })).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });

  } catch (error) {
    console.error("Create order error:", error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};


// ==========================================
// GET MY ORDERS
// ==========================================

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE ORDER
// ==========================================

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    ).populate(
      "user",
      "fullName email phone"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Customer can only view own order
    if (
      order.user._id.toString() !==
        req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    
    await order.populate("user", "fullName email phone");

     return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET ALL ORDERS
// ==========================================

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "fullName email phone"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

export const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    const { orderStatus } = req.body;

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    // Enforce valid transitions
    const validTransitions = {
      Pending:    ["Processing", "Cancelled"],
      Processing: ["Shipped",    "Cancelled"],
      Shipped:    ["Delivered"],
      Delivered:  [],
      Cancelled:  [],
    };

    const allowed = validTransitions[order.orderStatus] || [];

    if (order.orderStatus !== orderStatus && !allowed.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition order from "${order.orderStatus}" to "${orderStatus}".`,
      });
    }

    order.orderStatus = orderStatus;

    if (
      orderStatus === "Delivered" &&
      !order.deliveredAt
    ) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send notification to user based on new status
    const notifMap = {
      Processing: { type: "order_processing", title: "Order is Being Processed",  message: `Your order #${order._id.toString().slice(-8).toUpperCase()} is now being processed.` },
      Confirmed:  { type: "order_confirmed",  title: "Order Confirmed",            message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been confirmed.` },
      Shipped:    { type: "order_shipped",    title: "Order Shipped! 🚚",          message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been shipped and is on its way.` },
      Delivered:  { type: "order_delivered",  title: "Order Delivered! ✅",        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been delivered. Enjoy your purchase!` },
      Cancelled:  { type: "order_cancelled",  title: "Order Cancelled",            message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled.` },
    };
    const notif = notifMap[orderStatus];
    if (notif) {
      await createNotification({
        userId:  order.user,
        type:    notif.type,
        title:   notif.title,
        message: notif.message,
        link:    `/orders/${order._id}`,
      });
    }

    // Send email for key status changes (fire-and-forget)
    const orderOwner = await User.findById(order.user).select("fullName email");
    if (orderOwner?.email) {
      const FE  = process.env.FRONTEND_URL || "http://localhost:5173";
      let tmpl  = null;
      if (orderStatus === "Shipped") {
        tmpl = orderShippedEmail({ fullName: orderOwner.fullName, order, frontendUrl: FE });
      } else if (orderStatus === "Delivered") {
        tmpl = orderDeliveredEmail({ fullName: orderOwner.fullName, order, frontendUrl: FE });
      } else if (orderStatus === "Cancelled") {
        tmpl = orderCancelledEmail({ fullName: orderOwner.fullName, order, frontendUrl: FE });
      }
      if (tmpl) sendTemplate(orderOwner.email, tmpl).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      order,
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// CANCEL ORDER
// ==========================================

export const cancelOrder = async (
  req,
  res
) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Authorization
    if (
      order.user.toString() !==
        req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // Already cancelled
    if (
      order.orderStatus === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    // Cannot cancel shipped/delivered
    if (
      order.orderStatus === "Shipped" ||
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled.",
      });
    }

    // Restore stock
    for (const item of order.orderItems) {
      const product = await Product.findById(
        item.product
      );

      if (product) {
        product.stock += item.quantity;

        await product.save();
      }
    }

    order.orderStatus = "Cancelled";

    // Do not mark a cancelled unpaid COD order
    // as "Failed" unless an actual payment failed.
    if (order.paymentStatus === "Pending") {
      order.paymentStatus = "Failed";
    }

    await order.save();

    // Notify user
    await createNotification({
      userId:  order.user,
      type:    "order_cancelled",
      title:   "Order Cancelled",
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled and stock has been restored.`,
      link:    `/orders/${order._id}`,
    });

    // Send cancellation email (fire-and-forget)
    const cancelOwner = await User.findById(order.user).select("fullName email");
    if (cancelOwner?.email) {
      sendTemplate(cancelOwner.email, orderCancelledEmail({
        fullName:    cancelOwner.fullName,
        order,
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
      })).catch(() => {});
    }

    // Notify admins of cancellation (fire-and-forget)
    createAdminNotification({
      type:    "admin_order_cancelled",
      title:   "Order Cancelled",
      message: `Order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled by ${cancelOwner?.fullName || "a customer"}.`,
      link:    "/admin/orders",
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });

  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};