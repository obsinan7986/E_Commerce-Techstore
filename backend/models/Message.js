import mongoose from "mongoose";

/**
 * Support chat model.
 * One document = one conversation thread between a user and admin.
 * Messages are stored as an embedded array of "turns".
 */

const messageItemSchema = new mongoose.Schema(
  {
    sender:    { type: String, enum: ["user", "admin"], required: true },
    text:      { type: String, required: true, trim: true, maxlength: 5000 },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    subject: {
      type:      String,
      trim:      true,
      maxlength: 200,
      default:   "Support Request",
    },

    messages: [messageItemSchema],

    // Convenience fields updated on every new message
    lastMessageAt:   { type: Date, default: Date.now },
    lastMessageBy:   { type: String, enum: ["user", "admin"], default: "user" },

    // Unread counters
    unreadByAdmin:   { type: Number, default: 0 },  // msgs from user not yet read by admin
    unreadByUser:    { type: Number, default: 0 },  // replies from admin not yet read by user

    status: {
      type:    String,
      enum:    ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
