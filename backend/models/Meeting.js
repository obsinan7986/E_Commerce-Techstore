import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["invited", "accepted", "declined"], default: "invited" },
}, { _id: false });

const meetingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "" },

    date:      { type: Date,   required: true },
    startTime: { type: String, required: true },   // "HH:MM"
    endTime:   { type: String, required: true },   // "HH:MM"

    location:    { type: String, trim: true, default: "" },
    meetingType: { type: String, enum: ["Physical", "Online"], default: "Physical" },
    meetingLink: { type: String, trim: true, default: "" },

    status: {
      type:    String,
      enum:    ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },

    // Who created this meeting (owner only)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Target roles — everyone with these roles can see this meeting
    targetRoles: [{
      type: String,
      enum: ["admin", "finance", "seller", "owner"],
    }],

    // Specific individual participants (in addition to role-based access)
    participants: [participantSchema],

    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

meetingSchema.index({ date: 1, status: 1 });
meetingSchema.index({ "participants.user": 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
