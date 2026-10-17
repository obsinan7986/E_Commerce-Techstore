/**
 * Finance Controller
 * All routes require role = "finance" or "owner"
 *
 * Capabilities:
 *  - Finance Dashboard stats (totals, breakdowns, recent transactions)
 *  - View all payments/orders with full filter/search
 *  - View single order payment detail
 *  - Verify / reject manual payments (mirrors admin capability)
 *  - Mark order paymentStatus = "Refunded" (no payment gateway — DB only)
 */
import Order              from "../models/Order.js";
import User               from "../models/User.js";
import PaymentSettings    from "../models/PaymentSettings.js";
import Payout             from "../models/Payout.js";
import { settleOrderCommission } from "../utils/commissionEngine.js";
import createNotification from "../utils/createNotification.js";

const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

// ============================================================
// FINANCE DASHBOARD
// GET /api/finance/dashboard
// ============================================================
export const getFinanceDashboard = async (req, res) => {
  try {
    const [
      totalRevenue,
      totalPaid,
      totalPending,
      totalFailed,
      totalRefunded,
      totalOrders,
      manualPending,
      manualVerified,
      manualRejected,
      recentTransactions,
      monthlyRevenue,
      pSettings,
      sellerAgg,
      ledgerTransactions,
      pendingPayouts,
      pendingPayoutsCount,
    ] = await Promise.all([
      // Total revenue (all paid)
      Order.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // Count paid
      Order.countDocuments({ paymentStatus: "Paid" }),

      // Count pending
      Order.countDocuments({ paymentStatus: "Pending" }),

      // Count failed
      Order.countDocuments({ paymentStatus: "Failed" }),

      // Count refunded
      Order.countDocuments({ paymentStatus: "Refunded" }),

      // Total orders
      Order.countDocuments(),

      // Manual payment stats
      Order.countDocuments({
        "manualPayment.verificationStatus": "Pending",
        paymentMethod: { $in: MANUAL_METHODS },
      }),
      Order.countDocuments({
        "manualPayment.verificationStatus": "Verified",
        paymentMethod: { $in: MANUAL_METHODS },
      }),
      Order.countDocuments({
        "manualPayment.verificationStatus": "Rejected",
        paymentMethod: { $in: MANUAL_METHODS },
      }),

      // Recent 10 transactions
      Order.find({ paymentStatus: { $ne: "Pending" } })
        .populate("user", "fullName email")
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("user totalPrice paymentStatus paymentMethod orderStatus paidAt createdAt"),

      // Monthly revenue (last 6 months)
      Order.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Payment settings singleton for platform ledger
      PaymentSettings.findOne(),

      // Aggregated seller credit liability
      User.aggregate([
        { $match: { role: "seller" } },
        {
          $group: {
            _id: null,
            totalSellerNetCredits: { $sum: "$sellerCredits" },
            totalPendingCredits:   { $sum: "$pendingSellerCredits" },
            totalCommissionPaid:   { $sum: "$totalCommissionDebited" },
          },
        },
      ]),

      // Comprehensive ledger split transactions (last 25 orders)
      Order.find()
        .populate("user", "fullName email")
        .populate("orderItems.seller", "fullName email")
        .sort({ createdAt: -1 })
        .limit(25)
        .select("orderItems totalPrice totalGrossItemsPrice totalCommissionDebited totalSellerNetPayout isCommissionSettled paymentStatus paymentMethod orderStatus paidAt createdAt"),

      // Pending seller payout requests
      Payout.find({ status: "Pending" })
        .populate("seller", "fullName storeName email phone sellerCredits pendingSellerCredits payoutAccount")
        .sort({ createdAt: -1 }),

      // Pending seller payouts count
      Payout.countDocuments({ status: "Pending" }),
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const paymentSettings = pSettings || {};
    const sellerTotals = sellerAgg[0] || { totalSellerNetCredits: 0, totalPendingCredits: 0 };

    // Payment method breakdown
    const methodBreakdown = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$totalPrice" } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalRevenue:            revenue,
        platformTotalRevenue:    paymentSettings.platformTotalRevenue || revenue,
        platformTotalCommission: paymentSettings.platformTotalCommission || 0,
        totalGrossSales:         revenue,
        totalSellerNetCredits:   sellerTotals.totalSellerNetCredits || 0,
        pendingSellerCredits:    sellerTotals.totalPendingCredits || 0,
        totalOrders,
        paidCount:               totalPaid,
        pendingCount:            totalPending,
        failedCount:             totalFailed,
        refundedCount:           totalRefunded,
        manualPending,
        manualVerified,
        manualRejected,
        pendingPayouts:          pendingPayouts || [],
        pendingPayoutsCount:     pendingPayoutsCount || 0,
        methodBreakdown,
        monthlyRevenue,
        recentTransactions,
        ledgerTransactions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET ALL PAYMENTS (paginated, filterable)
// GET /api/finance/payments
// Query: page, limit, paymentStatus, paymentMethod, keyword, sort
// ============================================================
export const getFinancePayments = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 15, 1), 100);
    const { paymentStatus, paymentMethod, keyword } = req.query;
    const sort    = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (keyword?.trim()) {
      const re = { $regex: keyword.trim(), $options: "i" };
      const matchingUsers = await User.find({
        $or: [{ fullName: re }, { email: re }, { phone: re }],
      }).select("_id");
      filter.$or = [
        ...(matchingUsers.length ? [{ user: { $in: matchingUsers.map(u => u._id) } }] : []),
        { "paymentResult.txRef":         re },
        { "paymentResult.transactionId": re },
      ];
      if (!filter.$or.length) {
        return res.status(200).json({ success: true, total: 0, page, pages: 0, payments: [] });
      }
    }

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate("user", "fullName email phone")
        .populate("orderItems.seller", "fullName email")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .select("user orderItems totalPrice totalGrossItemsPrice totalCommissionDebited totalSellerNetPayout isCommissionSettled paymentStatus paymentMethod orderStatus paymentResult manualPayment paidAt createdAt"),
    ]);

    const payments = orders.map((o) => ({
      orderId:                o._id,
      customer:               o.user,
      amount:                 o.totalPrice,
      totalGrossItemsPrice:   o.totalGrossItemsPrice || o.totalPrice,
      totalCommissionDebited: o.totalCommissionDebited || 0,
      totalSellerNetPayout:   o.totalSellerNetPayout || 0,
      isCommissionSettled:    !!o.isCommissionSettled,
      orderItems:             o.orderItems || [],
      paymentStatus:          o.paymentStatus,
      paymentMethod:          o.paymentMethod,
      orderStatus:            o.orderStatus,
      txRef:                  o.paymentResult?.txRef         || "",
      transactionId:          o.paymentResult?.transactionId || "",
      manualStatus:           o.manualPayment?.verificationStatus || "None",
      manualScreenshot:       o.manualPayment?.screenshotUrl  || "",
      manualNote:             o.manualPayment?.adminNote      || "",
      paidAt:                 o.paidAt,
      createdAt:              o.createdAt,
    }));

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SINGLE ORDER PAYMENT DETAIL
// GET /api/finance/payments/:orderId
// ============================================================
export const getFinanceOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "fullName email phone address")
      .populate("manualPayment.reviewedBy", "fullName");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// VERIFY MANUAL PAYMENT (Finance)
// PUT /api/finance/payments/:orderId/verify
// Body: { action: "verify" | "reject", adminNote? }
// Mirrors the admin endpoint — finance can verify/reject manual payments
// ============================================================
export const financeVerifyPayment = async (req, res) => {
  try {
    const { action, adminNote } = req.body;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "verify" or "reject".' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (!MANUAL_METHODS.includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Only manual payment orders can be verified here.",
      });
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

    // Settle commission and credit Finance upon verification
    if (action === "verify" && !order.isCommissionSettled) {
      await settleOrderCommission(order._id);
    } else if (action === "reject" && !order.isCommissionSettled) {
      for (const item of order.orderItems) {
        if (item.seller && item.sellerNetEarning > 0) {
          await User.findByIdAndUpdate(item.seller, {
            $inc: { pendingSellerCredits: -item.sellerNetEarning },
          });
        }
      }
    }

    // Notify customer
    if (action === "verify") {
      await createNotification({
        userId:  order.user,
        type:    "payment_verified",
        title:   "Payment Verified ✅",
        message: `Your payment for order #${order._id.toString().slice(-8).toUpperCase()} has been verified.`,
        link:    `/orders/${order._id}`,
      });
    } else {
      await createNotification({
        userId:  order.user,
        type:    "payment_rejected",
        title:   "Payment Rejected ❌",
        message: `Your payment for order #${order._id.toString().slice(-8).toUpperCase()} was rejected.${order.manualPayment.adminNote ? " Reason: " + order.manualPayment.adminNote : ""}`,
        link:    `/orders/${order._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Payment ${action === "verify" ? "verified" : "rejected"} successfully.`,
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// MARK REFUND (DB only — no payment gateway)
// PATCH /api/finance/payments/:orderId/refund
// Body: { reason? }
// Sets paymentStatus = "Refunded" in MongoDB only.
// Actual money return requires manual action outside the system.
// ============================================================
export const markRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid orders can be marked as refunded.",
      });
    }

    order.paymentStatus = "Refunded";
    order.orderStatus   = "Cancelled";
    if (req.body.reason?.trim()) {
      order.manualPayment.adminNote = req.body.reason.trim();
    }
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as refunded. Please process the actual refund manually through your payment provider.",
      note:    "This is a record-keeping action only. No money has been moved automatically.",
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// FINANCE STATS (summary for reports)
// GET /api/finance/stats
// ============================================================
export const getFinanceStats = async (req, res) => {
  try {
    const [
      revenueAgg,
      pendingAgg,
      refundedAgg,
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      refundedOrders,
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: "Paid"     } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.aggregate([{ $match: { paymentStatus: "Pending"  } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.aggregate([{ $match: { paymentStatus: "Refunded" } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "Paid"     }),
      Order.countDocuments({ paymentStatus: "Pending"  }),
      Order.countDocuments({ paymentStatus: "Failed"   }),
      Order.countDocuments({ paymentStatus: "Refunded" }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue:   revenueAgg[0]?.total  || 0,
        pendingAmount:  pendingAgg[0]?.total  || 0,
        refundedAmount: refundedAgg[0]?.total || 0,
        totalOrders,
        paidOrders,
        pendingOrders,
        failedOrders,
        refundedOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET ALL SELLER PAYOUT REQUESTS
// GET /api/finance/payouts
// ============================================================
export const getFinancePayouts = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;

    const payouts = await Payout.find(filter)
      .populate("seller", "fullName storeName email phone sellerCredits pendingSellerCredits payoutAccount")
      .populate("processedBy", "fullName email")
      .sort({ createdAt: -1 });

    const pendingCount = await Payout.countDocuments({ status: "Pending" });

    res.status(200).json({
      success: true,
      payouts,
      pendingCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// APPROVE & MARK PAID / REJECT SELLER PAYOUT
// PATCH /api/finance/payouts/:id/approve
// Body: { action: "approve" | "reject", adminNote?: string }
// ============================================================
export const approveFinancePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findById(id).populate("seller");
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout request not found." });
    }

    if (payout.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Payout request has already been marked as ${payout.status}.`,
      });
    }

    const { action = "approve", adminNote = "" } = req.body;

    if (action === "approve") {
      payout.status = "Paid";
      payout.processedBy = req.user._id;
      payout.processedAt = new Date();
      if (adminNote) payout.adminNote = adminNote.trim();
      await payout.save();

      // Release pending seller escrow credits
      if (payout.seller) {
        await User.findByIdAndUpdate(payout.seller._id, {
          $inc: {
            pendingSellerCredits: -payout.amount,
          },
        });

        // Notify seller of payout completion
        await createNotification({
          userId: payout.seller._id,
          type: "payout_paid",
          title: "Payout Approved & Disbursed ✅",
          message: `Your payout request of ETB ${payout.amount.toLocaleString()} has been approved and marked paid to your ${payout.accountDetails?.bankName || "account"}.`,
          link: "/seller/dashboard?tab=earnings",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Payout of ETB ${payout.amount.toLocaleString()} approved and marked as Paid.`,
        payout,
      });
    } else {
      // Reject payout: return credits back to sellerCredits
      payout.status = "Rejected";
      payout.processedBy = req.user._id;
      payout.processedAt = new Date();
      if (adminNote) payout.adminNote = adminNote.trim();
      await payout.save();

      if (payout.seller) {
        await User.findByIdAndUpdate(payout.seller._id, {
          $inc: {
            sellerCredits: payout.amount,
            pendingSellerCredits: -payout.amount,
          },
        });

        await createNotification({
          userId: payout.seller._id,
          type: "payout_rejected",
          title: "Payout Request Declined ❌",
          message: `Your payout request of ETB ${payout.amount.toLocaleString()} was declined.${adminNote ? " Reason: " + adminNote : ""}`,
          link: "/seller/dashboard?tab=earnings",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Payout request rejected and credits returned to seller balance.`,
        payout,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
