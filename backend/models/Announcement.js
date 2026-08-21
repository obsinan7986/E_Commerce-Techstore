import mongoose from "mongoose";

const readBySchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, default: Date.now },
}, { _id: false });

const announcementSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: [
        "Business Update",
        "Product Update",
        "Price Update",
        "Company News",
        "Meeting Notice",
        "Important Notice",
      ],
      default: "Business Update",
    },

    priority: {
      type:    String,
      enum:    ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },

    publishDate:    { type: Date, default: Date.now },
    expirationDate: { type: Date, default: null },

    // Audience — empty array = all staff
    targetRoles: [{
      type: String,
      enum: ["admin", "finance", "seller", "owner"],
    }],

    // Optionally specific users
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isPublished: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Track who has read this announcement
    readBy: [readBySchema],
  },
  { timestamps: true }
);

announcementSchema.index({ publishDate: 1, isPublished: 1 });
announcementSchema.index({ expirationDate: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
