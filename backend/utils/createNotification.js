/**
 * Helper to create a notification document.
 * Fire-and-forget — errors are logged but never thrown,
 * so a notification failure never breaks the main request.
 *
 * @param {Object} payload
 * @param {string} payload.userId   - Mongoose ObjectId (or string)
 * @param {string} payload.type     - Notification type enum value
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {string} [payload.link]   - optional frontend route
 */
import Notification from "../models/Notification.js";

const createNotification = async ({ userId, type, title, message, link = "" }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error("[createNotification] Failed:", err.message);
  }
};

export default createNotification;
