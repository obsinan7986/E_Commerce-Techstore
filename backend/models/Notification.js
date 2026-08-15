import mongoose from "mongoose";

/**
 * Notification model.
 * One document per notification per user.
 * type is a short machine key used to pick an icon/colour on the frontend.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "order_placed",      // order created
        "payment_verified",  // admin verified manual payment
        "payment_rejected",  // admin rejected manual payment
        "order_confirmed",   // order status → Confirmed
        "order_processing",  // order status → Processing
        "order_shipped",     // order status → Shipped
        "order_delivered",   // order status → Delivered
        "order_cancelled",   // order cancelled
      ],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Optional deep-link (e.g. "/orders/:id")
    link: { type: String, default: "" },

    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Index for fast "unread count" queries
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
