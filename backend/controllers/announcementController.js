/**
 * Announcement Controller
 * Owner: full CRUD
 * Admin/Finance/Seller: view announcements targeted at their role or them specifically
 * Customer: no access
 */
import Announcement from "../models/Announcement.js";
import User         from "../models/User.js";
import Notification from "../models/Notification.js";

const STAFF_ROLES = ["admin", "finance", "seller", "owner"];

/* ── helper: is announcement visible to this user? ─────────── */
const isVisibleTo = (ann, userId, role) => {
  if (role === "owner") return true;
  if (!ann.isPublished) return false;
  const now = new Date();
  if (ann.publishDate   && ann.publishDate   > now) return false;
  if (ann.expirationDate && ann.expirationDate < now) return false;

  // All-staff (empty targetRoles + empty targetUsers)
  if (!ann.targetRoles.length && !ann.targetUsers.length) return true;
  if (ann.targetRoles.includes(role)) return true;
  if (ann.targetUsers.some(u => u.toString() === userId.toString())) return true;
  return false;
};

/* ── helper: build DB filter for non-owner ──────────────────── */
const audienceFilter = (userId, role) => {
  const now = new Date();
  return {
    isPublished: true,
    publishDate: { $lte: now },
    $or: [
      { expirationDate: null },
      { expirationDate: { $gt: now } },
    ],
    $or: [
      { targetRoles: role },
      { targetUsers: userId },
      { targetRoles: { $size: 0 }, targetUsers: { $size: 0 } },
    ],
  };
};

// ============================================================
// GET ANNOUNCEMENTS  –  GET /api/announcements
// ============================================================
export const getAnnouncements = async (req, res) => {
  try {
    const { category, priority, page = 1, limit = 20, includeExpired } = req.query;
    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 100);

    let filter = {};
    if (req.user.role !== "owner") {
      const now = new Date();
      filter = {
        isPublished: true,
        publishDate: { $lte: now },
        $or: [
          { targetRoles: req.user.role },
          { targetUsers: req.user._id },
          { $and: [{ targetRoles: { $size: 0 } }, { targetUsers: { $size: 0 } }] },
        ],
      };
      if (!includeExpired) {
        filter.$and = [
          { $or: [{ expirationDate: null }, { expirationDate: { $gt: now } }] },
        ];
      }
    } else {
      // Owner sees all
      if (!includeExpired) {
        const now = new Date();
        filter.$or = [
          { expirationDate: null },
          { expirationDate: { $gt: now } },
        ];
      }
    }

    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const [total, announcements] = await Promise.all([
      Announcement.countDocuments(filter),
      Announcement.find(filter)
        .populate("createdBy", "fullName email")
        .sort({ priority: -1, publishDate: -1 })
        .skip((p - 1) * l)
        .limit(l),
    ]);

    // Add read status for each announcement
    const userId = req.user._id.toString();
    const list = announcements.map(a => {
      const obj = a.toObject();
      obj.isRead = a.readBy.some(r => r.user?.toString() === userId);
      return obj;
    });

    res.status(200).json({ success: true, total, page: p, pages: Math.ceil(total / l), announcements: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SINGLE ANNOUNCEMENT  –  GET /api/announcements/:id
// ============================================================
export const getAnnouncementById = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id)
      .populate("createdBy", "fullName email")
      .populate("targetUsers", "fullName email");

    if (!ann) return res.status(404).json({ success: false, message: "Announcement not found." });

    if (!isVisibleTo(ann, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const obj = ann.toObject();
    obj.isRead = ann.readBy.some(r => r.user?.toString() === req.user._id.toString());

    res.status(200).json({ success: true, announcement: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CREATE ANNOUNCEMENT  –  POST /api/announcements  (owner only)
// ============================================================
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title, content, category, priority,
      publishDate, expirationDate,
      targetRoles = [], targetUserIds = [],
      isPublished = true,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "title and content are required." });
    }

    const validUsers = targetUserIds.length
      ? (await User.find({ _id: { $in: targetUserIds }, role: { $in: STAFF_ROLES } }).select("_id")).map(u => u._id)
      : [];

    const ann = await Announcement.create({
      title, content, category, priority,
      publishDate:    publishDate    ? new Date(publishDate)    : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      targetRoles:    targetRoles.filter(r => STAFF_ROLES.includes(r)),
      targetUsers:    validUsers,
      isPublished,
      createdBy: req.user._id,
    });

    // If published, notify all targeted staff users
    if (isPublished) {
      let recipientIds = [];
      if (targetRoles.length || validUsers.length) {
        const q = { role: { $in: STAFF_ROLES }, isSuspended: false };
        if (targetRoles.length && !validUsers.length) q.role = { $in: targetRoles };
        const users = await User.find(q).select("_id");
        recipientIds = users.map(u => u._id);
        if (validUsers.length) {
          const extra = validUsers.filter(id => !recipientIds.some(r => r.toString() === id.toString()));
          recipientIds = [...recipientIds, ...extra];
        }
      } else {
        // All staff
        const users = await User.find({ role: { $in: STAFF_ROLES }, isSuspended: false }).select("_id");
        recipientIds = users.map(u => u._id);
      }
      if (recipientIds.length) {
        const docs = recipientIds.map(uid => ({
          user: uid, targetRole: "user",
          type: "announcement_published",
          title: `📢 ${ann.title}`,
          message: `A new ${ann.category} announcement has been published.`,
          link: `/comm/announcements`,
        }));
        await Notification.insertMany(docs).catch(() => {});
      }
    }

    res.status(201).json({ success: true, message: "Announcement created.", announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPDATE ANNOUNCEMENT  –  PUT /api/announcements/:id  (owner only)
// ============================================================
export const updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: "Announcement not found." });

    const fields = ["title", "content", "category", "priority", "isPublished"];
    for (const f of fields) {
      if (req.body[f] !== undefined) ann[f] = req.body[f];
    }
    if (req.body.publishDate    !== undefined) ann.publishDate    = new Date(req.body.publishDate);
    if (req.body.expirationDate !== undefined) ann.expirationDate = req.body.expirationDate ? new Date(req.body.expirationDate) : null;
    if (req.body.targetRoles    !== undefined) ann.targetRoles    = req.body.targetRoles.filter(r => STAFF_ROLES.includes(r));
    if (req.body.targetUserIds  !== undefined) {
      const valid = await User.find({ _id: { $in: req.body.targetUserIds }, role: { $in: STAFF_ROLES } }).select("_id");
      ann.targetUsers = valid.map(u => u._id);
    }

    await ann.save();
    res.status(200).json({ success: true, message: "Announcement updated.", announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// DELETE ANNOUNCEMENT  –  DELETE /api/announcements/:id  (owner only)
// ============================================================
export const deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: "Announcement not found." });
    await ann.deleteOne();
    res.status(200).json({ success: true, message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// MARK AS READ  –  PATCH /api/announcements/:id/read
// ============================================================
export const markAnnouncementRead = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: "Announcement not found." });

    const alreadyRead = ann.readBy.some(r => r.user?.toString() === req.user._id.toString());
    if (!alreadyRead) {
      ann.readBy.push({ user: req.user._id });
      await ann.save();
    }
    res.status(200).json({ success: true, message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
