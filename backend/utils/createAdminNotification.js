/**
 * createAdminNotification
 * Fire-and-forget helper that saves an admin-targeted notification.
 * Admin notifications are queried by targetRole:"admin" (not by user id).
 *
 * @param {{ type: string, title: string, message: string, link?: string }} payload
 */
import Notification from "../models/Notification.js";

const createAdminNotification = async ({ type, title, message, link = "" }) => {
  try {
    await Notification.create({ targetRole: "admin", type, title, message, link });
  } catch (err) {
    console.error("[createAdminNotification] Failed:", err.message);
  }
};

export default createAdminNotification;
