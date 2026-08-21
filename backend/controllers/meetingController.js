/**
 * Meeting Controller
 * Owner: full CRUD, manage participants
 * Admin/Finance/Seller: view meetings they are invited to or targeted by role
 */
import Meeting      from "../models/Meeting.js";
import User         from "../models/User.js";
import Notification from "../models/Notification.js";

const STAFF_ROLES = ["admin", "finance", "seller", "owner"];

/* ── helper: notify a list of user ids ─────────────────────── */
const notifyUsers = async (userIds, type, title, message, link) => {
  const docs = userIds.map(uid => ({ user: uid, targetRole: "user", type, title, message, link }));
  if (docs.length) await Notification.insertMany(docs).catch(() => {});
};

/* ── helper: build visibility filter for non-owner ─────────── */
const visibilityFilter = (userId, role) => ({
  $or: [
    { targetRoles: role },
    { "participants.user": userId },
  ],
});

// ============================================================
// GET MEETINGS  –  GET /api/meetings
// Owner: all meetings | others: only meetings visible to them
// ============================================================
export const getMeetings = async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role !== "owner") {
      Object.assign(filter, visibilityFilter(req.user._id, req.user.role));
    }
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 100);

    const [total, meetings] = await Promise.all([
      Meeting.countDocuments(filter),
      Meeting.find(filter)
        .populate("createdBy", "fullName email")
        .populate("participants.user", "fullName email role")
        .sort({ date: 1, startTime: 1 })
        .skip((p - 1) * l)
        .limit(l),
    ]);

    res.status(200).json({ success: true, total, page: p, pages: Math.ceil(total / l), meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SCHEDULE (upcoming + today + past)  –  GET /api/meetings/schedule
// ============================================================
export const getSchedule = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const baseFilter = req.user.role !== "owner"
      ? visibilityFilter(req.user._id, req.user.role)
      : {};

    const [todayMeetings, upcoming, recent] = await Promise.all([
      Meeting.find({ ...baseFilter, date: { $gte: today, $lt: tomorrow } })
        .populate("createdBy", "fullName")
        .populate("participants.user", "fullName role")
        .sort({ startTime: 1 }),

      Meeting.find({ ...baseFilter, date: { $gte: tomorrow }, status: "Scheduled" })
        .populate("createdBy", "fullName")
        .populate("participants.user", "fullName role")
        .sort({ date: 1, startTime: 1 })
        .limit(20),

      Meeting.find({ ...baseFilter, date: { $lt: today } })
        .populate("createdBy", "fullName")
        .sort({ date: -1, startTime: -1 })
        .limit(10),
    ]);

    res.status(200).json({ success: true, todayMeetings, upcoming, recent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SINGLE MEETING  –  GET /api/meetings/:id
// ============================================================
export const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("createdBy", "fullName email")
      .populate("participants.user", "fullName email role");

    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found." });

    // Non-owner: check visibility
    if (req.user.role !== "owner") {
      const canSee =
        meeting.targetRoles.includes(req.user.role) ||
        meeting.participants.some(p => p.user?._id?.toString() === req.user._id.toString());
      if (!canSee) return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CREATE MEETING  –  POST /api/meetings  (owner only)
// ============================================================
export const createMeeting = async (req, res) => {
  try {
    const {
      title, description, date, startTime, endTime,
      location, meetingType, meetingLink,
      targetRoles = [], participantIds = [],
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "title, date, startTime and endTime are required." });
    }
    if (new Date(date) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ success: false, message: "Meeting date cannot be in the past." });
    }

    // Validate participant user ids
    const validParticipants = participantIds.length
      ? (await User.find({ _id: { $in: participantIds }, role: { $in: STAFF_ROLES } }).select("_id")).map(u => ({ user: u._id }))
      : [];

    const meeting = await Meeting.create({
      title, description, date, startTime, endTime,
      location, meetingType, meetingLink: meetingType === "Online" ? meetingLink : "",
      targetRoles: targetRoles.filter(r => STAFF_ROLES.includes(r)),
      participants: validParticipants,
      createdBy: req.user._id,
    });

    await meeting.populate("participants.user", "fullName email");

    // Notify individually-added participants
    if (validParticipants.length) {
      await notifyUsers(
        validParticipants.map(p => p.user),
        "meeting_invited",
        `Meeting Invitation: ${title}`,
        `You have been invited to "${title}" on ${new Date(date).toLocaleDateString()}.`,
        `/owner/meetings`
      );
    }

    res.status(201).json({ success: true, message: "Meeting created.", meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPDATE MEETING  –  PUT /api/meetings/:id  (owner only)
// ============================================================
export const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found." });
    if (meeting.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot edit a cancelled meeting." });
    }

    const {
      title, description, date, startTime, endTime,
      location, meetingType, meetingLink, status,
      targetRoles, participantIds,
    } = req.body;

    if (title        !== undefined) meeting.title        = title;
    if (description  !== undefined) meeting.description  = description;
    if (date         !== undefined) meeting.date         = new Date(date);
    if (startTime    !== undefined) meeting.startTime    = startTime;
    if (endTime      !== undefined) meeting.endTime      = endTime;
    if (location     !== undefined) meeting.location     = location;
    if (meetingType  !== undefined) meeting.meetingType  = meetingType;
    if (meetingLink  !== undefined) meeting.meetingLink  = meetingType === "Online" ? meetingLink : "";
    if (status       !== undefined) meeting.status       = status;
    if (targetRoles  !== undefined) meeting.targetRoles  = targetRoles.filter(r => STAFF_ROLES.includes(r));

    if (participantIds !== undefined) {
      const valid = participantIds.length
        ? (await User.find({ _id: { $in: participantIds }, role: { $in: STAFF_ROLES } }).select("_id"))
        : [];
      meeting.participants = valid.map(u => {
        const existing = meeting.participants.find(p => p.user?.toString() === u._id.toString());
        return existing || { user: u._id, status: "invited" };
      });
    }

    await meeting.save();
    await meeting.populate(["createdBy", { path: "participants.user", select: "fullName email role" }]);

    // Notify participants of update
    const participantUserIds = meeting.participants.map(p => p.user?._id || p.user);
    if (participantUserIds.length) {
      await notifyUsers(
        participantUserIds,
        "meeting_updated",
        `Meeting Updated: ${meeting.title}`,
        `"${meeting.title}" on ${new Date(meeting.date).toLocaleDateString()} has been updated.`,
        `/owner/meetings`
      );
    }

    res.status(200).json({ success: true, message: "Meeting updated.", meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CANCEL MEETING  –  PATCH /api/meetings/:id/cancel  (owner only)
// ============================================================
export const cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("participants.user", "_id fullName");
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found." });
    if (meeting.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Already cancelled." });
    }

    meeting.status       = "Cancelled";
    meeting.cancelReason = (req.body.reason || "").trim();
    await meeting.save();

    // Notify participants
    const ids = meeting.participants.map(p => p.user?._id || p.user).filter(Boolean);
    if (ids.length) {
      await notifyUsers(
        ids,
        "meeting_cancelled",
        `Meeting Cancelled: ${meeting.title}`,
        `"${meeting.title}" scheduled for ${new Date(meeting.date).toLocaleDateString()} has been cancelled.${meeting.cancelReason ? " Reason: " + meeting.cancelReason : ""}`,
        `/owner/meetings`
      );
    }

    res.status(200).json({ success: true, message: "Meeting cancelled.", meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// DELETE MEETING  –  DELETE /api/meetings/:id  (owner only)
// ============================================================
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found." });
    await meeting.deleteOne();
    res.status(200).json({ success: true, message: "Meeting deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET STAFF USERS (for participant picker)
// GET /api/meetings/staff-users
// ============================================================
export const getStaffUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: STAFF_ROLES }, isSuspended: false })
      .select("fullName email role")
      .sort({ role: 1, fullName: 1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
