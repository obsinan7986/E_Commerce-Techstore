import Product from "../models/Product.js";
import axios from "axios";
import crypto from "crypto";
import Order from "../models/Order.js";
import { initializeChapa } from "../services/chapaService.js";

// ==========================================
// Initialize Chapa Payment
// ==========================================
export const initializePayment = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount and orderId are required.",
      });
    }

    // Find Order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Already paid?
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    // Generate unique transaction reference
    const txRef = crypto.randomUUID();

    // Save payment info
    order.paymentMethod = "Chapa";
    order.paymentStatus = "Pending";

    order.paymentResult = {
      transactionId: "",
      txRef: txRef,
      status: "Pending",
      method: "Chapa",
      amount: Number(amount),
      currency: "ETB",
    };

    await order.save();

    // Payment request to Chapa
    const paymentData = {
      amount: Number(amount),
      currency: "ETB",

      email: req.user.email,
      first_name: req.user.fullName,
      last_name: "",

      tx_ref: txRef,

      callback_url:
        "http://localhost:5000/api/payments/chapa/callback",

      return_url:
        "http://localhost:5173/payment-success",

      customization: {
        title: "Tech E-Commerce",
        description: "Secure product payment",
      },
    };

    const response = await initializeChapa(paymentData);

    res.status(200).json({
      success: true,
      txRef,
      checkout_url: response.data.checkout_url,
      chapaResponse: response,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message,
    });

  }
};

// ==========================================
// Verify Chapa Payment
// ==========================================
export const verifyPayment = async (req, res) => {

  try {

    const { tx_ref } = req.params;

    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    const payment = response.data.data;

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    if (payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment is not completed.",
      });
    }

    // Find order
    const order = await Order.findOne({
      "paymentResult.txRef": tx_ref,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.paymentStatus = "Paid";
    order.orderStatus = "Processing";
    order.isPaid = true;
    order.paidAt = new Date();

    if (order.paymentStatus === "Paid") {
     return res.status(200).json({
        success: true,
        message: "Payment already verified.",
        order,
      });
    }

    // ======================================
// Reduce Product Stock
// ======================================

for (const item of order.orderItems) {

  const product = await Product.findById(item.product);

  if (!product) {
    continue;
  }

  if (product.stock < item.quantity) {
    return res.status(400).json({
      success: false,
      message: `${product.name} does not have enough stock.`,
    });
  }

  product.stock -= item.quantity;

  await product.save();
}

    order.paymentResult = {
      transactionId: payment.id || "",
      txRef: payment.tx_ref,
      status: payment.status,
      method: payment.payment_method || "Chapa",
      amount: Number(payment.amount),
      currency: payment.currency,
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message,
    });

  }

};