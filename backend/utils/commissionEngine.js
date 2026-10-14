import Order from "../models/Order.js";
import User from "../models/User.js";
import PaymentSettings from "../models/PaymentSettings.js";
import Notification from "../models/Notification.js";

/**
 * Calculates financial breakdown for an individual order item.
 * Priority: product.commissionOverride ?? seller.commissionAgreement?.agreedRate ?? paymentSettings.defaultCommissionRate ?? 10
 */
export const calculateItemCommission = (item, product, seller, paymentSettings) => {
  const effectiveSeller = seller || product?.seller || {};
  const defaultRate = paymentSettings?.defaultCommissionRate ?? 10;
  const defaultType = paymentSettings?.defaultCommissionType ?? "percentage";

  const rate =
    product?.commissionOverride !== null &&
    product?.commissionOverride !== undefined &&
    !isNaN(Number(product.commissionOverride))
      ? Number(product.commissionOverride)
      : effectiveSeller?.commissionAgreement?.agreedRate !== undefined &&
        effectiveSeller?.commissionAgreement?.agreedRate !== null &&
        !isNaN(Number(effectiveSeller.commissionAgreement.agreedRate))
      ? Number(effectiveSeller.commissionAgreement.agreedRate)
      : defaultRate;

  const commissionType =
    effectiveSeller?.commissionAgreement?.commissionType || defaultType;

  const qty = Number(item?.qty || item?.quantity) || 1;
  const price = Number(item?.price) || 0;
  const grossItemTotal = Number((price * qty).toFixed(2));

  let commissionDebited = 0;
  if (commissionType === "percentage") {
    commissionDebited = Number((grossItemTotal * (rate / 100)).toFixed(2));
  } else {
    commissionDebited = Number((rate * qty).toFixed(2));
  }

  // Guard: debited commission cannot exceed gross item price
  commissionDebited = Math.min(commissionDebited, grossItemTotal);
  const sellerNetEarning = Number((grossItemTotal - commissionDebited).toFixed(2));

  return {
    rate,
    commissionType,
    grossItemTotal,
    commissionDebited,
    sellerNetEarning,
  };
};

/**
 * Automatically debits agreed commission from Seller's product price
 * and credits platform Finance total revenue upon payment confirmation.
 * Fully idempotent with double-settlement guard.
 */
export const settleOrderCommission = async (orderId) => {
  try {
    if (!orderId) {
      return { success: false, message: "Missing order ID" };
    }

    // Atomic fetch-and-lock to ensure absolute idempotency
    const order = await Order.findOneAndUpdate(
      { _id: orderId, isCommissionSettled: { $ne: true } },
      { $set: { isCommissionSettled: true } },
      { new: true }
    ).populate("orderItems.seller");

    if (!order) {
      console.log(`[settleOrderCommission] Order ${orderId} is already settled or does not exist.`);
      return { success: false, message: "Order is already settled or not found." };
    }

    const orderIdShort = order._id.toString().slice(-8).toUpperCase();
    let totalCommissionSum = 0;
    let totalSellerNetSum = 0;

    // Process seller credits
    for (const item of order.orderItems) {
      const sellerId = item.seller?._id || item.seller;
      if (!sellerId) continue;

      const net = Number(item.sellerNetEarning) || 0;
      const commission = Number(item.commissionDebited) || 0;

      totalCommissionSum += commission;
      totalSellerNetSum += net;

      // Update seller balances: transfer from pending to available credits
      await User.findByIdAndUpdate(sellerId, {
        $inc: {
          pendingSellerCredits: -net,
          sellerCredits: net,
          totalCommissionDebited: commission,
        },
      });

      // Notify seller
      try {
        await Notification.create({
          user: sellerId,
          targetRole: "seller",
          type: "commission_settled",
          title: "Payment Credited to Seller Balance",
          message: `Order #${orderIdShort} paid: ETB ${net.toLocaleString()} credited to your balance after ETB ${commission.toLocaleString()} platform commission debit.`,
          link: `/seller/sales`,
        });
      } catch (notifErr) {
        console.error(`[settleOrderCommission] Seller notification error:`, notifErr.message);
      }
    }

    // Fallback totals from order properties if not computed
    const commissionToAdd =
      order.totalCommissionDebited !== undefined && order.totalCommissionDebited !== null
        ? Number(order.totalCommissionDebited)
        : totalCommissionSum;

    const grossRevenueToAdd = Number(order.totalPrice) || 0;

    // Increment Finance platform totals in PaymentSettings
    await PaymentSettings.findOneAndUpdate(
      {},
      {
        $inc: {
          platformTotalRevenue: grossRevenueToAdd,
          platformTotalCommission: commissionToAdd,
        },
      },
      { upsert: true, new: true }
    );

    // Notify Finance & Owner staff
    try {
      await Notification.create({
        targetRole: "finance",
        type: "finance_revenue_credit",
        title: "Platform Revenue & Commission Credited",
        message: `Order #${orderIdShort} settled: Gross ETB ${grossRevenueToAdd.toLocaleString()} confirmed. ETB ${commissionToAdd.toLocaleString()} commission retained in platform revenue.`,
        link: `/finance/dashboard`,
      });
    } catch (notifErr) {
      console.error(`[settleOrderCommission] Finance notification error:`, notifErr.message);
    }

    console.log(
      `[settleOrderCommission] Successfully settled Order #${orderIdShort}: Gross ETB ${grossRevenueToAdd}, Commission ETB ${commissionToAdd}`
    );

    return {
      success: true,
      message: `Order #${orderIdShort} commission settled successfully.`,
      order,
    };
  } catch (error) {
    console.error("[settleOrderCommission] Critical error:", error);
    return { success: false, message: error.message };
  }
};
