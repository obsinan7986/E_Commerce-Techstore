/**
 * TechStore — HTML email templates
 * All templates return { subject, html } for use with nodemailer.
 */

/* ── Shared brand constants ──────────────────────────────────────── */
const BRAND  = "OBSA_TechStore";
const BLUE   = "#2563EB";
const DARK   = "#111827";
const GREY   = "#6B7280";
const LIGHT  = "#F9FAFB";
const WHITE  = "#FFFFFF";
const GREEN  = "#16A34A";
const RED    = "#DC2626";
const ORANGE = "#D97706";

/* ── Base HTML wrapper ───────────────────────────────────────────── */
const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BLUE};padding:28px 36px;text-align:center;">
              <span style="font-size:28px;font-weight:900;color:${WHITE};letter-spacing:-0.5px;">
                🛒 ${BRAND}
              </span>
              <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px;">
                Ethiopia's Premier Tech Marketplace
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${LIGHT};border-top:1px solid #E5E7EB;padding:24px 36px;text-align:center;">
              <p style="margin:0 0 8px;color:${GREY};font-size:13px;">
                © ${new Date().getFullYear()} ${BRAND} · Addis Ababa, Ethiopia
              </p>
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ── Reusable snippets ───────────────────────────────────────────── */
const heading = (text) =>
  `<h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${DARK};letter-spacing:-0.3px;">${text}</h1>`;

const para = (text, color = DARK) =>
  `<p style="margin:0 0 14px;font-size:15px;color:${color};line-height:1.65;">${text}</p>`;

const btn = (label, url, bg = BLUE) =>
  `<div style="text-align:center;margin:24px 0;">
     <a href="${url}" style="display:inline-block;padding:14px 32px;background:${bg};color:${WHITE};font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
       ${label}
     </a>
   </div>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />`;

const badge = (text, bg, color = WHITE) =>
  `<span style="display:inline-block;padding:5px 14px;background:${bg};color:${color};border-radius:20px;font-size:13px;font-weight:700;">${text}</span>`;

const infoRow = (label, value) =>
  `<tr>
     <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;font-size:13px;color:${GREY};font-weight:600;width:42%;">${label}</td>
     <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;font-size:14px;color:${DARK};font-weight:500;">${value}</td>
   </tr>`;

const infoTable = (rows) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:20px;">
     <tbody>${rows}</tbody>
   </table>`;

const orderItemsTable = (items, BASE_URL = "") => {
  const rows = items.map((item) => {
    const imgSrc = item.image?.startsWith("http")
      ? item.image
      : `${BASE_URL}${item.image || ""}`;
    return `<tr>
      <td style="padding:12px 14px;border-bottom:1px solid #F1F5F9;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;">
            <img src="${imgSrc}" width="52" height="52"
              style="object-fit:contain;border-radius:8px;border:1px solid #E5E7EB;background:#FAFAFA;" />
          </td>
          <td>
            <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:${DARK};">${item.name}</p>
            <p style="margin:0;font-size:12px;color:${GREY};">Qty: ${item.quantity}</p>
          </td>
        </tr></table>
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:14px;font-weight:800;color:${BLUE};white-space:nowrap;">
        ETB ${Number(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>`;
  }).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:20px;">
    <thead>
      <tr style="background:#E5E7EB;">
        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:${GREY};text-transform:uppercase;letter-spacing:.5px;">Product</th>
        <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:${GREY};text-transform:uppercase;letter-spacing:.5px;">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

/* ══════════════════════════════════════════════════════════════════
   1. WELCOME EMAIL
   ══════════════════════════════════════════════════════════════════ */
export const welcomeEmail = ({ fullName, email, frontendUrl = "" }) => ({
  subject: `Welcome to ${BRAND}! Your account is ready 🎉`,
  html: wrap(`
    ${heading(`Welcome to ${BRAND}, ${fullName}! 🎉`)}
    ${para(`Your account has been created successfully. You're now part of Ethiopia's premier tech marketplace.`)}

    ${infoTable(
      infoRow("Name",  fullName) +
      infoRow("Email", email) +
      infoRow("Joined", new Date().toLocaleDateString("en-US", { dateStyle: "long" }))
    )}

    <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#166534;">🎁 First Order Bonus</p>
      <p style="margin:0;font-size:13.5px;color:#166534;line-height:1.6;">
        As a new member, you get <strong>10% off your first order!</strong> The discount will be automatically applied at checkout.
      </p>
    </div>

    ${btn("Start Shopping", `${frontendUrl}/products`)}
    ${divider()}
    ${para("If you didn't create this account, please ignore this email.", GREY)}
  `),
});

/* ══════════════════════════════════════════════════════════════════
   2. ORDER CONFIRMATION
   ══════════════════════════════════════════════════════════════════ */
export const orderConfirmationEmail = ({ fullName, order, frontendUrl = "", baseUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  const discount = order.coupon?.discountAmount > 0
    ? infoRow("Discount", `<span style="color:${GREEN};font-weight:800;">− ETB ${Number(order.coupon.discountAmount).toLocaleString()} (${order.coupon.code})</span>`)
    : "";

  return {
    subject: `Order Confirmed #${orderId} — ${BRAND}`,
    html: wrap(`
      ${heading(`Order Confirmed! ✅`)}
      ${para(`Hi <strong>${fullName}</strong>, your order has been placed successfully. We'll keep you updated as it progresses.`)}

      ${infoTable(
        infoRow("Order ID",       `<strong>#${orderId}</strong>`) +
        infoRow("Date",           new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", { dateStyle: "long" })) +
        infoRow("Payment Method", order.paymentMethod) +
        infoRow("Order Status",   badge("Pending", ORANGE))
      )}

      <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${DARK};">Order Items</p>
      ${orderItemsTable(order.orderItems || [], baseUrl)}

      ${infoTable(
        infoRow("Subtotal",  `ETB ${Number(order.itemsPrice).toLocaleString()}`) +
        infoRow("Shipping",  order.shippingPrice === 0 ? '<span style="color:#16A34A;font-weight:700;">FREE</span>' : `ETB ${Number(order.shippingPrice).toLocaleString()}`) +
        infoRow("Tax (15%)", `ETB ${Number(order.taxPrice).toLocaleString()}`) +
        discount +
        infoRow("Total",     `<strong style="font-size:16px;color:${BLUE};">ETB ${Number(order.totalPrice).toLocaleString()}</strong>`)
      )}

      <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${DARK};">Delivery Address</p>
      ${infoTable(
        infoRow("Name",    order.shippingAddress?.fullName || "") +
        infoRow("Phone",   order.shippingAddress?.phone   || "") +
        infoRow("Address", order.shippingAddress?.address || "") +
        infoRow("City",    order.shippingAddress?.city    || "")
      )}

      ${order.paymentMethod !== "Chapa" && order.paymentMethod !== "Cash On Delivery"
        ? `<div style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
             <p style="margin:0;font-size:13.5px;color:#92400E;line-height:1.6;">
               📸 <strong>Action required:</strong> Please upload your payment screenshot so we can verify and process your order.
             </p>
           </div>`
        : ""
      }

      ${btn("View Order Details", `${frontendUrl}/orders/${order._id}`)}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   3. PAYMENT VERIFIED
   ══════════════════════════════════════════════════════════════════ */
export const paymentVerifiedEmail = ({ fullName, order, frontendUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  return {
    subject: `Payment Verified for Order #${orderId} ✅ — ${BRAND}`,
    html: wrap(`
      ${heading(`Payment Verified! ✅`)}
      ${para(`Hi <strong>${fullName}</strong>, great news! Your payment for order <strong>#${orderId}</strong> has been verified and confirmed.`)}

      ${infoTable(
        infoRow("Order ID",       `<strong>#${orderId}</strong>`) +
        infoRow("Amount Paid",    `<strong style="color:${BLUE};">ETB ${Number(order.totalPrice).toLocaleString()}</strong>`) +
        infoRow("Payment Method", order.paymentMethod) +
        infoRow("Verified At",    new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })) +
        infoRow("Order Status",   badge("Confirmed", GREEN))
      )}

      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13.5px;color:#166534;line-height:1.6;">
          🚀 Your order is now being prepared for shipment. You'll receive another email when it ships.
        </p>
      </div>

      ${btn("Track Your Order", `${frontendUrl}/orders/${order._id}`, GREEN)}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   4. PAYMENT REJECTED
   ══════════════════════════════════════════════════════════════════ */
export const paymentRejectedEmail = ({ fullName, order, adminNote = "", frontendUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  return {
    subject: `Payment Could Not Be Verified for Order #${orderId} — ${BRAND}`,
    html: wrap(`
      ${heading(`Payment Could Not Be Verified ❌`)}
      ${para(`Hi <strong>${fullName}</strong>, unfortunately we were unable to verify your payment for order <strong>#${orderId}</strong>.`)}

      ${adminNote
        ? `<div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
             <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991B1B;">Reason from our team:</p>
             <p style="margin:0;font-size:13.5px;color:#991B1B;">${adminNote}</p>
           </div>`
        : ""
      }

      ${para("Please re-upload a clear screenshot of your successful payment transfer.")}

      ${infoTable(
        infoRow("Order ID",       `<strong>#${orderId}</strong>`) +
        infoRow("Amount",         `ETB ${Number(order.totalPrice).toLocaleString()}`) +
        infoRow("Payment Method", order.paymentMethod)
      )}

      ${btn("Re-upload Screenshot", `${frontendUrl}/orders/${order._id}?upload=1`, RED)}
      ${divider()}
      ${para("If you believe this is a mistake, please contact our support team.", GREY)}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   5. ORDER SHIPPED
   ══════════════════════════════════════════════════════════════════ */
export const orderShippedEmail = ({ fullName, order, trackingNumber = "", frontendUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  return {
    subject: `Your Order #${orderId} Has Been Shipped! 🚚 — ${BRAND}`,
    html: wrap(`
      ${heading(`Your Order Is On Its Way! 🚚`)}
      ${para(`Hi <strong>${fullName}</strong>, exciting news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you.`)}

      ${infoTable(
        infoRow("Order ID",       `<strong>#${orderId}</strong>`) +
        infoRow("Order Status",   badge("Shipped", "#8B5CF6")) +
        (trackingNumber ? infoRow("Tracking Number", `<strong style="font-family:monospace;">${trackingNumber}</strong>`) : "") +
        infoRow("Delivery To",    `${order.shippingAddress?.fullName || ""}, ${order.shippingAddress?.city || ""}`) +
        infoRow("Est. Delivery",  "2–5 business days")
      )}

      <div style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13.5px;color:#0369A1;line-height:1.6;">
          📦 Our delivery team will contact you before arrival. Please ensure someone is available to receive the package.
        </p>
      </div>

      ${btn("Track Your Order", `${frontendUrl}/orders/${order._id}`, "#8B5CF6")}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   6. ORDER DELIVERED
   ══════════════════════════════════════════════════════════════════ */
export const orderDeliveredEmail = ({ fullName, order, frontendUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  return {
    subject: `Order #${orderId} Delivered Successfully! 📦 — ${BRAND}`,
    html: wrap(`
      ${heading(`Order Delivered! 📦`)}
      ${para(`Hi <strong>${fullName}</strong>, your order <strong>#${orderId}</strong> has been delivered successfully. We hope you love your new tech!`)}

      ${infoTable(
        infoRow("Order ID",      `<strong>#${orderId}</strong>`) +
        infoRow("Delivered On",  new Date().toLocaleDateString("en-US", { dateStyle: "long" })) +
        infoRow("Order Status",  badge("Delivered", GREEN))
      )}

      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#166534;">⭐ Enjoying your purchase?</p>
        <p style="margin:6px 0 0;font-size:13.5px;color:#166534;line-height:1.6;">
          Share your experience by leaving a review. Your feedback helps other customers make informed decisions.
        </p>
      </div>

      ${btn("Leave a Review", `${frontendUrl}/orders/${order._id}`, GREEN)}
      ${divider()}
      ${para(`Need help with your order? <a href="${frontendUrl}/contact" style="color:${BLUE};font-weight:600;">Contact our support team</a>.`, GREY)}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   7. ORDER CANCELLED
   ══════════════════════════════════════════════════════════════════ */
export const orderCancelledEmail = ({ fullName, order, frontendUrl = "" }) => {
  const orderId = order._id.toString().slice(-8).toUpperCase();
  return {
    subject: `Order #${orderId} Cancelled — ${BRAND}`,
    html: wrap(`
      ${heading(`Order Cancelled`)}
      ${para(`Hi <strong>${fullName}</strong>, your order <strong>#${orderId}</strong> has been cancelled as requested.`)}

      ${infoTable(
        infoRow("Order ID",     `<strong>#${orderId}</strong>`) +
        infoRow("Total",        `ETB ${Number(order.totalPrice).toLocaleString()}`) +
        infoRow("Status",       badge("Cancelled", RED)) +
        infoRow("Cancelled At", new Date().toLocaleDateString("en-US", { dateStyle: "long" }))
      )}

      <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:13.5px;color:#991B1B;line-height:1.6;">
          Product stock has been restored. If a payment was made, a refund will be processed within 3–7 business days.
        </p>
      </div>

      ${btn("Browse Products", `${frontendUrl}/products`)}
    `),
  };
};

/* ══════════════════════════════════════════════════════════════════
   8. PASSWORD RESET
   ══════════════════════════════════════════════════════════════════ */
export const passwordResetEmail = ({ fullName, resetUrl, expiresIn = "1 hour" }) => ({
  subject: `Reset Your Password — ${BRAND}`,
  html: wrap(`
    ${heading(`Reset Your Password 🔐`)}
    ${para(`Hi <strong>${fullName}</strong>, we received a request to reset the password for your ${BRAND} account.`)}
    ${para(`Click the button below to set a new password. This link expires in <strong>${expiresIn}</strong>.`)}

    ${btn("Reset My Password", resetUrl, RED)}

    <div style="background:${LIGHT};border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${GREY};">Or copy this link:</p>
      <p style="margin:0;font-size:12px;color:${GREY};word-break:break-all;">${resetUrl}</p>
    </div>

    ${divider()}
    ${para("If you didn't request a password reset, you can safely ignore this email. Your password will not change.", GREY)}
    ${para("For security, never share this link with anyone.", GREY)}
  `),
});
