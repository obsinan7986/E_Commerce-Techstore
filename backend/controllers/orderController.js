import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

// @desc Create New Order

export const createOrder = async (req, res) => {
  try {

    const {
      shippingAddress,
      paymentMethod
    } = req.body;

    // Find user's cart
    const cart = await Cart.findOne({
      user: req.user._id
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: `${item.product.name} is out of stock.`,
      });
    }

    // Build order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      price: item.product.price
    }));

    // Calculate prices
    const itemsPrice = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const shippingPrice = itemsPrice >= 5000 ? 0 : 200;

    const taxPrice = itemsPrice * 0.15;

    const totalPrice =
      itemsPrice +
      shippingPrice +
      taxPrice;

    // Create Order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    });

    // Clear cart after order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// @desc    Get Logged-in User Orders

export const getMyOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// @desc    Get Single Order

export const getOrderById = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id)
      .populate("user", "fullName email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
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
// @desc    Get All Orders

export const getAllOrders = async (req, res) => {

  try {

    const orders = await Order.find()
      .populate("user", "fullName email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// @desc    Update Order Status

export const updateOrderStatus = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = req.body.orderStatus;

    if (
      req.body.orderStatus === "Delivered" &&
      !order.deliveredAt
    ) {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// Cancel Order
// ======================================
export const cancelOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // User can only cancel their own order
    if (
      order.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // Already cancelled
    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    // Cannot cancel after shipping
    if (
      order.orderStatus === "Shipped" ||
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled.",
      });
    }

    // Restore stock only if payment was completed
    if (order.paymentStatus === "Paid") {

      for (const item of order.orderItems) {

        const product = await Product.findById(item.product);

        if (product) {

          product.stock += item.quantity;

          await product.save();

        }

      }

    }

    order.orderStatus = "Cancelled";
    order.paymentStatus = "Failed";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};