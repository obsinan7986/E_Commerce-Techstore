import mongoose from "mongoose";

/**
 * Notification model.
 * One document per notification per recipient.
 *
 * targetRole: "user"  → customer notification  (existing behaviour)
 *             "admin" → admin notification      (new)
 *
 * For admin notifications the `user` field points to ANY admin
 * (we query by targetRole="admin" instead of a specific user id).
 * We use a sentinel ObjectId "000000000000000000000001" as the
 * admin-notification owner so the index stays efficient.
 */
const notificationSchema = new mongoose.Schema(
  {
    // For user notifications → the customer's _id
    // For admin notifications → left as null / undefined (queried by targetRole)
    user: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   "User",
      index: true,
      default: null,
    },

    // Differentiates customer vs admin bucket
    targetRole: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
      index:   true,
    },

    type: {
      type: String,
      enum: [
        // ── Customer notifications ──────────────────────────
        "order_placed",
        "payment_verified",
        "payment_rejected",
        "order_confirmed",
        "order_processing",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        // ── Admin notifications ─────────────────────────────
        "admin_new_user",
        "admin_new_order",
        "admin_payment_screenshot",
        "admin_new_message",
        "admin_new_review",
        "admin_order_cancelled",
        // ── Meeting / Announcement notifications ────────────
        "meeting_invited",
        "meeting_updated",
        "meeting_cancelled",
        "announcement_published",
      ],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Optional deep-link
    link: { type: String, default: "" },

    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ targetRole: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
