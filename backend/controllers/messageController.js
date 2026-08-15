import Conversation from "../models/Message.js";

/* ══════════════════════════════════════════════════════
   CUSTOMER ENDPOINTS
   ══════════════════════════════════════════════════════ */

// GET /api/messages/mine
// Returns the logged-in user's conversation (or 404 if none)
export const getMyConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ user: req.user._id })
      .sort({ lastMessageAt: -1 });
    if (!conv) return res.status(200).json({ success: true, conversation: null });
    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/messages
// User sends first message (creates conversation) or appends to existing
export const sendMessage = async (req, res) => {
  try {
    const { text, subject } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required." });
    }
    if (text.trim().length > 5000) {
      return res.status(400).json({ success: false, message: "Message too long (max 5000 chars)." });
    }

    let conv = await Conversation.findOne({ user: req.user._id });

    const newMsg = { sender: "user", text: text.trim(), isRead: false };

    if (!conv) {
      conv = await Conversation.create({
        user:          req.user._id,
        subject:       subject?.trim() || "Support Request",
        messages:      [newMsg],
        lastMessageAt: new Date(),
        lastMessageBy: "user",
        unreadByAdmin: 1,
        unreadByUser:  0,
      });
    } else {
      conv.messages.push(newMsg);
      conv.lastMessageAt = new Date();
      conv.lastMessageBy = "user";
      conv.unreadByAdmin += 1;
      if (subject?.trim() && conv.subject === "Support Request") {
        conv.subject = subject.trim();
      }
      await conv.save();
    }

    return res.status(201).json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/messages/mine/read
// User marks all admin replies as read
export const markUserMessagesRead = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ user: req.user._id });
    if (!conv) return res.status(200).json({ success: true });

    conv.messages.forEach((m) => {
      if (m.sender === "admin") m.isRead = true;
    });
    conv.unreadByUser = 0;
    await conv.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages/mine/unread-count
// Lightweight poll — how many admin replies the user hasn't read yet
export const getUserUnreadCount = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ user: req.user._id }).select("unreadByUser");
    return res.status(200).json({ success: true, count: conv?.unreadByUser || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   ADMIN ENDPOINTS
   ══════════════════════════════════════════════════════ */

// GET /api/messages/admin  — list all conversations (newest first)
export const getAllConversations = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const keyword = (req.query.keyword || "").trim();

    let query = Conversation.find()
      .populate("user", "fullName email phone")
      .sort({ lastMessageAt: -1 });

    const total = await Conversation.countDocuments();
    const convs = await query.skip((page - 1) * limit).limit(limit);

    // Client-side keyword filter (small scale)
    const filtered = keyword
      ? convs.filter((c) => {
          const u = c.user || {};
          const kw = keyword.toLowerCase();
          return (
            (u.fullName || "").toLowerCase().includes(kw) ||
            (u.email    || "").toLowerCase().includes(kw) ||
            (c.subject  || "").toLowerCase().includes(kw)
          );
        })
      : convs;

    const totalUnread = await Conversation.aggregate([
      { $group: { _id: null, total: { $sum: "$unreadByAdmin" } } },
    ]);

    return res.status(200).json({
      success:      true,
      total,
      page,
      pages:        Math.ceil(total / limit),
      unreadTotal:  totalUnread[0]?.total || 0,
      conversations: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages/admin/:conversationId  — get full conversation
export const getConversationById = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId)
      .populate("user", "fullName email phone");
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found." });
    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/messages/admin/:conversationId/reply  — admin sends reply
export const adminReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Reply text is required." });
    }

    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found." });

    conv.messages.push({ sender: "admin", text: text.trim(), isRead: false });
    conv.lastMessageAt = new Date();
    conv.lastMessageBy = "admin";
    conv.unreadByUser  += 1;
    await conv.save();

    const populated = await conv.populate("user", "fullName email phone");
    return res.status(201).json({ success: true, conversation: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/messages/admin/:conversationId/read  — admin marks user msgs read
export const adminMarkRead = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found." });

    conv.messages.forEach((m) => {
      if (m.sender === "user") m.isRead = true;
    });
    conv.unreadByAdmin = 0;
    await conv.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/messages/admin/:conversationId/close
export const closeConversation = async (req, res) => {
  try {
    const conv = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { status: "closed" },
      { new: true }
    );
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found." });
    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/messages/admin/:conversationId
export const deleteConversation = async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.conversationId);
    return res.status(200).json({ success: true, message: "Conversation deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages/admin/unread-count  — total unread for admin badge
export const getAdminUnreadCount = async (req, res) => {
  try {
    const result = await Conversation.aggregate([
      { $group: { _id: null, total: { $sum: "$unreadByAdmin" } } },
    ]);
    return res.status(200).json({ success: true, count: result[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
