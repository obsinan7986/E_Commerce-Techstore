/**
 * AdminMessages — customer support inbox for admins.
 * Route: /admin/messages
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAllConversations,
  getConversationById,
  adminReply,
  adminMarkRead,
  closeConversation,
  deleteConversation,
} from "../services/messageService";
import "../styles/messageCenter.css";

/* ── helpers ── */
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });

/* ── Bubble (same pattern as user side) ── */
const Bubble = ({ msg, customerInitial }) => {
  const isUser = msg.sender === "user";
  return (
    <div className={`mc-bubble-row mc-bubble-row--${isUser ? "user" : "admin"}`}>
      <div className={`mc-bubble-avatar mc-bubble-avatar--${isUser ? "user" : "admin"}`}>
        {isUser ? customerInitial : "🛒"}
      </div>
      <div className={`mc-bubble mc-bubble--${isUser ? "user" : "admin"}`}>
        {msg.text}
        <div className="mc-bubble-meta">
          <span>{isUser ? "Customer" : "Support"} · {timeAgo(msg.createdAt)}</span>
          {!isUser && <span className="mc-read-tick">{msg.isRead ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
};

const DateDivider = ({ date }) => (
  <div className="mc-date-divider"><span>{fmtDate(date)}</span></div>
);

/* ── Main component ── */
const AdminMessages = () => {
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  /* List state */
  const [convList,   setConvList]   = useState([]);
  const [unreadTotal,setUnreadTotal]= useState(0);
  const [listLoading,setListLoading]= useState(true);
  const [search,     setSearch]     = useState("");

  /* Selected conversation */
  const [selected,   setSelected]   = useState(null);  // full conversation object
  const [chatLoading,setChatLoading] = useState(false);

  /* Reply */
  const [replyText,  setReplyText]  = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendErr,    setSendErr]    = useState("");

  /* Feedback */
  const [msg,        setMsg]        = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  /* ── Load list ── */
  const loadList = useCallback(async () => {
    try {
      const data = await getAllConversations({ keyword: search, limit: 50 });
      setConvList(data.conversations || []);
      setUnreadTotal(data.unreadTotal || 0);
    } catch { /* silent */ }
    finally { setListLoading(false); }
  }, [search]);

  useEffect(() => { loadList(); }, [loadList]);

  // Poll list every 20 s
  useEffect(() => {
    const id = setInterval(loadList, 20000);
    return () => clearInterval(id);
  }, [loadList]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  /* ── Select conversation ── */
  const handleSelect = async (conv) => {
    try {
      setChatLoading(true);
      setSendErr("");
      setReplyText("");
      const data = await getConversationById(conv._id);
      setSelected(data.conversation);
      // Mark as read
      if (conv.unreadByAdmin > 0) {
        adminMarkRead(conv._id).then(loadList).catch(() => {});
      }
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to load conversation.");
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Send reply ── */
  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    try {
      setSending(true);
      setSendErr("");
      const data = await adminReply(selected._id, replyText.trim());
      setSelected(data.conversation);
      setReplyText("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
      loadList();
    } catch (err) {
      setSendErr(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
  };

  const handleTextChange = (e) => {
    setReplyText(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  /* ── Close conversation ── */
  const handleClose = async () => {
    if (!selected) return;
    try {
      const data = await closeConversation(selected._id);
      setSelected(data.conversation);
      flash("success", "Conversation closed.");
      loadList();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to close.");
    }
  };

  /* ── Delete conversation ── */
  const handleDelete = async () => {
    if (!selected || !window.confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      await deleteConversation(selected._id);
      setSelected(null);
      flash("success", "Conversation deleted.");
      loadList();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to delete.");
    }
  };

  /* ── Render messages ── */
  const renderMessages = (conv) => {
    if (!conv?.messages?.length) return (
      <div className="mc-empty-chat">
        <span className="mc-empty-chat-icon">💬</span>
        <p>No messages in this conversation.</p>
      </div>
    );
    const customerInitial = (conv.user?.fullName || "U").charAt(0).toUpperCase();
    let lastDate = null;
    return conv.messages.map((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDiv = msgDate !== lastDate;
      lastDate = msgDate;
      return (
        <div key={msg._id}>
          {showDiv && <DateDivider date={msg.createdAt} />}
          <Bubble msg={msg} customerInitial={customerInitial} />
        </div>
      );
    });
  };

  /* ── Render ── */
  return (
    <div className="admin-page amsg-page">
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: 18 }}>
        <div>
          <h1>Customer Messages</h1>
          <p>Support inbox — reply to customer messages</p>
        </div>
        {unreadTotal > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#FEF3C7", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#B45309" }}>
            📬 {unreadTotal} unread
          </span>
        )}
      </div>

      {msg.text && (
        <div className={`admin-feedback admin-feedback--${msg.type}`} style={{ marginBottom: 14 }}>
          {msg.text}
        </div>
      )}

      <div className="amsg-layout">
        {/* ── Sidebar ── */}
        <div className="amsg-sidebar">
          <div className="amsg-sidebar-header">
            <h2>
              Conversations
              {unreadTotal > 0 && <span className="amsg-unread-badge">{unreadTotal}</span>}
            </h2>
            <input
              className="amsg-search"
              type="text"
              placeholder="Search by name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="amsg-conv-list">
            {listLoading ? (
              <div className="amsg-empty-list">Loading…</div>
            ) : convList.length === 0 ? (
              <div className="amsg-empty-list">
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                No conversations yet
              </div>
            ) : (
              convList.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];
                const isActive = selected?._id === c._id;
                const hasUnread = c.unreadByAdmin > 0;
                return (
                  <div
                    key={c._id}
                    className={`amsg-conv-item${isActive ? " amsg-conv-item--active" : ""}${hasUnread ? " amsg-conv-item--unread" : ""}`}
                    onClick={() => handleSelect(c)}
                  >
                    <div className="amsg-conv-avatar">
                      {(c.user?.fullName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="amsg-conv-info">
                      <div className="amsg-conv-name">{c.user?.fullName || "Unknown"}</div>
                      <div className="amsg-conv-preview">
                        {lastMsg ? `${lastMsg.sender === "admin" ? "You: " : ""}${lastMsg.text}` : c.subject}
                      </div>
                    </div>
                    <div>
                      <div className="amsg-conv-time">{timeAgo(c.lastMessageAt)}</div>
                      {c.status === "closed" && (
                        <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "right", marginTop: 2 }}>closed</div>
                      )}
                    </div>
                    {hasUnread && <span className="amsg-conv-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className="amsg-chat-panel">
          {!selected && !chatLoading ? (
            <div className="amsg-no-selection">
              <span>💬</span>
              <p>Select a conversation to view and reply</p>
            </div>
          ) : chatLoading ? (
            <div className="amsg-no-selection"><p>Loading…</p></div>
          ) : (
            <>
              {/* Chat header */}
              <div className="amsg-chat-header">
                <div className="amsg-chat-user">
                  <div className="amsg-conv-avatar">
                    {(selected.user?.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="amsg-chat-user-name">{selected.user?.fullName}</div>
                    <div className="amsg-chat-user-email">
                      {selected.user?.email} · {selected.subject}
                      <span className={`mc-status-chip mc-status-chip--${selected.status}`} style={{ marginLeft: 8 }}>
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="amsg-chat-actions">
                  {selected.status === "open" && (
                    <button className="amsg-action-btn amsg-action-btn--close" onClick={handleClose}>
                      ✓ Close
                    </button>
                  )}
                  <button className="amsg-action-btn amsg-action-btn--delete" onClick={handleDelete}>
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="amsg-messages">
                {renderMessages(selected)}
                <div ref={messagesEndRef} />
              </div>

              {/* Send error */}
              {sendErr && (
                <div style={{ padding: "8px 16px", background: "#FEF2F2", color: "#991B1B", fontSize: 13 }}>
                  {sendErr}
                </div>
              )}

              {/* Reply input */}
              {selected.status === "closed" ? (
                <div className="mc-closed-notice">This conversation is closed.</div>
              ) : (
                <div className="mc-input-area">
                  <textarea
                    ref={textareaRef}
                    className="mc-textarea"
                    rows={1}
                    placeholder="Type your reply… (Enter to send)"
                    value={replyText}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />
                  <button
                    className="mc-send-btn"
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    aria-label="Send reply"
                  >
                    {sending ? "…" : "➤"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
