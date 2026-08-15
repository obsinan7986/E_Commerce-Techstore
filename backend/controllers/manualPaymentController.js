import Order           from "../models/Order.js";
import PaymentSettings from "../models/PaymentSettings.js";
import createNotification from "../utils/createNotification.js";
import { sendTemplate }   from "../utils/emailService.js";
import { paymentVerifiedEmail, paymentRejectedEmail } from "../utils/emailTemplates.js";

const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

// ============================================================
// GET PAYMENT SETTINGS (public — shown on checkout)
// GET /api/payments/settings
// ============================================================
export const getPaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) settings = new PaymentSettings();  // return defaults
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error("[getPaymentSettings]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPDATE PAYMENT SETTINGS  (admin only)
// PUT /api/payments/settings
// Body: { bankName, accountName, accountNumber, instructions }
// File: qrCode (multipart/form-data, field name "qrCode")
// ============================================================
export const updatePaymentSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();
    if (!settings) settings = new PaymentSettings();

    const { instructions, bankAccounts } = req.body;
    if (instructions !== undefined) settings.instructions = instructions.trim();

    // bankAccounts comes as JSON string when sent with FormData
    if (bankAccounts !== undefined) {
      try {
        const parsed = typeof bankAccounts === "string" ? JSON.parse(bankAccounts) : bankAccounts;
        if (Array.isArray(parsed)) settings.bankAccounts = parsed;
      } catch {
        // ignore bad parse, keep existing
      }
    }

    if (req.file) {
      settings.bankQrCode = `/uploads/${req.file.filename}`;
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    return res.status(200).json({ success: true, message: "Payment settings updated.", settings });
  } catch (err) {
    console.error("[updatePaymentSettings]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPLOAD PAYMENT SCREENSHOT  (customer — own order only)
// POST /api/payments/screenshot/:orderId
// File: screenshot (multipart/form-data, field name "screenshot")
// ============================================================
export const uploadPaymentScreenshot = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!MANUAL_METHODS.includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Screenshot upload is only for manual payment methods (${MANUAL_METHODS.join(", ")}).`,
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "This order is already paid." });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot upload screenshot for a cancelled order." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a payment screenshot." });
    }

    order.manualPayment.screenshotUrl          = `/uploads/${req.file.filename}`;
    order.manualPayment.uploadedAt             = new Date();
    order.manualPayment.verificationStatus     = "Pending";
    order.manualPayment.adminNote              = "";
    // Reset any previous rejection so admin reviews fresh
    order.manualPayment.reviewedAt             = undefined;
    order.manualPayment.reviewedBy             = undefined;

    // Also flag payment as pending admin review
    order.paymentStatus = "Pending";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment screenshot uploaded. Waiting for admin verification.",
      order,
    });
  } catch (err) {
    console.error("[uploadPaymentScreenshot]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// VERIFY MANUAL PAYMENT  (admin only)
// PUT /api/payments/manual/:orderId/verify
// Body: { action: "verify" | "reject", adminNote? }
// ============================================================
export const verifyManualPayment = async (req, res) => {
  try {
    const { action, adminNote } = req.body;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "verify" or "reject".' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.manualPayment?.verificationStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "No pending screenshot to review for this order.",
      });
    }

    if (action === "verify") {
      order.manualPayment.verificationStatus = "Verified";
      order.paymentStatus = "Paid";
      order.isPaid        = true;
      order.paidAt        = new Date();
      // Set order to Confirmed once payment is verified
      order.orderStatus   = "Confirmed";
    } else {
      order.manualPayment.verificationStatus = "Rejected";
      order.paymentStatus = "Failed";
      order.isPaid        = false;
    }

    order.manualPayment.adminNote  = (adminNote || "").trim();
    order.manualPayment.reviewedAt = new Date();
    order.manualPayment.reviewedBy = req.user._id;

    await order.save();

    const label = action === "verify" ? "verified" : "rejected";
    console.log(`[verifyManualPayment] Order ${order._id} payment ${label} by admin ${req.user._id}`);

    // Send notification to the order owner
    if (action === "verify") {
      await createNotification({
        userId:  order.user,
        type:    "payment_verified",
        title:   "Payment Verified ✅",
        message: `Your payment for order #${order._id.toString().slice(-8).toUpperCase()} has been verified. Your order is now confirmed!`,
        link:    `/orders/${order._id}`,
      });
    } else {
      await createNotification({
        userId:  order.user,
        type:    "payment_rejected",
        title:   "Payment Rejected ❌",
        message: `Your payment for order #${order._id.toString().slice(-8).toUpperCase()} was rejected.${order.manualPayment.adminNote ? " Reason: " + order.manualPayment.adminNote : " Please re-upload a clear screenshot."}`,
        link:    `/orders/${order._id}`,
      });
    }

    // Send email to the order owner (fire-and-forget)
    const { default: User } = await import("../models/User.js");
    const paymentOwner = await User.findById(order.user).select("fullName email");
    if (paymentOwner?.email) {
      const FE   = process.env.FRONTEND_URL || "http://localhost:5173";
      const tmpl = action === "verify"
        ? paymentVerifiedEmail({ fullName: paymentOwner.fullName, order, frontendUrl: FE })
        : paymentRejectedEmail({ fullName: paymentOwner.fullName, order, adminNote: order.manualPayment.adminNote, frontendUrl: FE });
      sendTemplate(paymentOwner.email, tmpl).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Payment ${label} successfully.`,
      order,
    });
  } catch (err) {
    console.error("[verifyManualPayment]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET MANUAL PAYMENT STATS  (admin only)
// GET /api/payments/manual/stats
// ============================================================
export const getManualPaymentStats = async (req, res) => {
  try {
    const [pending, verified, rejected] = await Promise.all([
      Order.countDocuments({ "manualPayment.verificationStatus": "Pending",  paymentMethod: { $in: MANUAL_METHODS } }),
      Order.countDocuments({ "manualPayment.verificationStatus": "Verified", paymentMethod: { $in: MANUAL_METHODS } }),
      Order.countDocuments({ "manualPayment.verificationStatus": "Rejected", paymentMethod: { $in: MANUAL_METHODS } }),
    ]);
    return res.status(200).json({ success: true, stats: { pending, verified, rejected } });
  } catch (err) {
    console.error("[getManualPaymentStats]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET PENDING MANUAL PAYMENTS  (admin only)
// GET /api/payments/manual/pending
// ============================================================
export const getPendingManualPayments = async (req, res) => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

    const filter = {
      "manualPayment.verificationStatus": req.query.status || "Pending",
      paymentMethod: { $in: MANUAL_METHODS },
    };

    // Filter by specific payment method
    if (req.query.method && MANUAL_METHODS.includes(req.query.method)) {
      filter.paymentMethod = req.query.method;
    }

    // Keyword search — matched after populate, so use aggregation-style lookup won't work here.
    // Instead, first match orders then filter by populated user name/email if keyword given.
    const total  = await Order.countDocuments(filter);
    let orders   = await Order.find(filter)
      .populate("user", "fullName email phone")
      .sort({ "manualPayment.uploadedAt": -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Client-side keyword filter (applied after DB query, limited by page size)
    if (req.query.keyword) {
      const kw = req.query.keyword.toLowerCase();
      orders = orders.filter((o) => {
        const u = o.user || {};
        return (
          (u.fullName   || "").toLowerCase().includes(kw) ||
          (u.email      || "").toLowerCase().includes(kw) ||
          o._id.toString().toLowerCase().includes(kw)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    console.error("[getPendingManualPayments]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
