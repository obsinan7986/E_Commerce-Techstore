/**
 * emailService.js
 * Thin wrapper around Nodemailer.
 * Configure SMTP via .env — works with Gmail, Outlook, Brevo, Mailgun, etc.
 *
 * Required .env variables:
 *   EMAIL_HOST        smtp.gmail.com
 *   EMAIL_PORT        587
 *   EMAIL_SECURE      false   (true for port 465)
 *   EMAIL_USER        your@gmail.com
 *   EMAIL_PASS        your_app_password
 *   EMAIL_FROM        "OBSA_TechStore <noreply@obsatechstore.com>"
 *
 * Optional:
 *   FRONTEND_URL      http://localhost:5173
 *   BACKEND_URL       http://localhost:5000
 */

import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // If no EMAIL_HOST is set, use Ethereal (fake SMTP for dev preview)
  if (!process.env.EMAIL_HOST) {
    console.warn("[emailService] EMAIL_HOST not set — emails will be logged only (no real sending).");
    return null;
  }

  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
};

/**
 * Send an email.
 * @param {string} to        recipient address
 * @param {string} subject   email subject
 * @param {string} html      HTML body
 * @returns {Promise<boolean>}
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const transport = getTransporter();

    if (!transport) {
      // Dev fallback — log subject so devs know emails would fire
      console.log(`[emailService] 📧 Would send email to <${to}>: "${subject}"`);
      return true;
    }

    const from = process.env.EMAIL_FROM || `"OBSA_TechStore" <noreply@obsatechstore.com>`;

    const info = await transport.sendMail({ from, to, subject, html });
    console.log(`[emailService] ✅ Email sent to <${to}>: "${subject}" (${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[emailService] ❌ Failed to send email to <${to}>: ${err.message}`);
    return false;   // never throw — email failure must never break business logic
  }
};

/** Convenience: send from a template object { subject, html } */
export const sendTemplate = async (to, template) => {
  return sendEmail(to, template.subject, template.html);
};
