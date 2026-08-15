import axios from "axios";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

const CHAPA_URL =
  "https://api.chapa.co/v1/transaction";

// ==========================================
// Helper: Verify transaction with Chapa
// ==========================================

const verifyWithChapa = async (txRef) => {
  const response = await axios.get(
    `${CHAPA_URL}/verify/${encodeURIComponent(txRef)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    }
  );

  return response.data?.data;
};

// ==========================================
// Helper: Mark order as paid
// ==========================================

const markOrderAsPaid = async (order, payment) => {
  // Security checks
  if (payment.tx_ref !== order.paymentResult.txRef) {
    throw new Error("Transaction reference does not match.");
  }

  if (payment.currency !== "ETB") {
    throw new Error("Payment currency does not match.");
  }

  const paidAmount = Number(payment.amount);

  if (paidAmount !== Number(order.totalPrice)) {
    throw new Error("Payment amount does not match order total.");
  }

  order.paymentStatus = "Paid";
  order.isPaid = true;
  order.paidAt = new Date();

  order.paymentResult.transactionId =
    payment.reference || "";

  order.paymentResult.status =
    payment.status || "";

  order.paymentResult.method =
    payment.method || "Chapa";

  order.paymentResult.amount =
    paidAmount;

  order.paymentResult.currency =
    payment.currency || "ETB";

  await order.save();

  // Clear cart after successful payment.
  // Only clear the cart belonging to this customer.
  await Cart.findOneAndUpdate(
    { user: order.user },
    { $set: { items: [] } }
  );

  return order;
};

// ==========================================
// INITIALIZE CHAPA PAYMENT
// ==========================================

export const initializeChapaPayment = async (
  req,
  res
) => {
  try {
    const {
      orderId,
      firstName,
      lastName,
      email,
      phone,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Only Chapa orders can use this endpoint.
    if (order.paymentMethod !== "Chapa") {
      return res.status(400).json({
        success: false,
        message:
          "This order is not configured for Chapa payment.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    // Don't create a second transaction reference
    // if the order already has one.
    const txRef =
      order.paymentResult?.txRef ||
      `TECHSTORE-${order._id}-${Date.now()}`;

    // Save transaction information
    order.paymentResult.txRef = txRef;
    order.paymentResult.amount =
      order.totalPrice;
    order.paymentResult.currency = "ETB";
    order.paymentResult.method = "Chapa";

    await order.save();

    const response = await axios.post(
      `${CHAPA_URL}/initialize`,
      {
        amount: order.totalPrice.toString(),

        currency: "ETB",

        email,

        first_name: firstName,

        last_name: lastName,

        phone_number: phone,

        tx_ref: txRef,

        callback_url:
          `${process.env.BACKEND_URL}/api/payments/chapa/callback`,

        return_url:
          `${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}`,

        customization: {
          title: "TechStore",
          description:
            `Payment for order ${order._id}`,
        },

        meta: {
          orderId: order._id.toString(),
        },
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.CHAPA_SECRET_KEY}`,

          "Content-Type":
            "application/json",
        },
      }
    );

    const checkoutUrl =
      response.data?.data?.checkout_url;

    if (!checkoutUrl) {
      return res.status(500).json({
        success: false,
        message:
          "Chapa did not return a checkout URL.",
      });
    }

    return res.status(200).json({
      success: true,
      checkoutUrl,
      txRef,
      orderId: order._id,
    });

  } catch (error) {
    console.error(
      "Chapa initialization error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to initialize Chapa payment.",
    });
  }
};

// ==========================================
// VERIFY CHAPA PAYMENT
// ==========================================

export const verifyChapaPayment = async (
  req,
  res
) => {
  try {
    const { txRef } = req.params;

    if (!txRef) {
      return res.status(400).json({
        success: false,
        message: "Transaction reference is required.",
      });
    }

    const payment =
      await verifyWithChapa(txRef);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    const order = await Order.findOne({
      "paymentResult.txRef": txRef,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Customer can only verify their own order.
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

    // Already paid
    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        status: "success",
        order,
      });
    }

    if (payment.status === "success") {
      await markOrderAsPaid(
        order,
        payment
      );

      return res.status(200).json({
        success: true,
        status: "success",
        order,
      });
    }

    if (
      payment.status === "failed" ||
      payment.status === "cancelled"
    ) {
      order.paymentStatus = "Failed";
      order.isPaid = false;

      order.paymentResult.status =
        payment.status;

      await order.save();

      return res.status(200).json({
        success: true,
        status: payment.status,
        order,
      });
    }

    // pending
    return res.status(200).json({
      success: true,
      status: payment.status || "pending",
      order,
    });

  } catch (error) {
    console.error(
      "Chapa verification error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Payment verification failed.",
    });
  }
};

// ==========================================
// CHAPA CALLBACK
// ==========================================

export const chapaCallback = async (
  req,
  res
) => {
  try {
    const txRef =
      req.query.tx_ref ||
      req.query.trx_ref;

    if (!txRef) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed`
      );
    }

    const payment =
      await verifyWithChapa(txRef);

    if (!payment) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed`
      );
    }

    const order = await Order.findOne({
      "paymentResult.txRef": txRef,
    });

    if (!order) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed`
      );
    }

    // SUCCESS
    if (payment.status === "success") {
      try {
        await markOrderAsPaid(
          order,
          payment
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}`
        );

      } catch (validationError) {
        console.error(
          "Payment validation error:",
          validationError.message
        );

        order.paymentStatus = "Failed";
        order.isPaid = false;

        await order.save();

        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/failed?orderId=${order._id}`
        );
      }
    }

    // FAILED / CANCELLED
    if (
      payment.status === "failed" ||
      payment.status === "cancelled"
    ) {
      order.paymentStatus = "Failed";
      order.isPaid = false;

      order.paymentResult.status =
        payment.status;

      await order.save();

      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed?orderId=${order._id}`
      );
    }

    // PENDING
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}&status=pending`
    );

  } catch (error) {
    console.error(
      "Chapa callback error:",
      error.response?.data ||
        error.message
    );

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed`
    );
  }
};