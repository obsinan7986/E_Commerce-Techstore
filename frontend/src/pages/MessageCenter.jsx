/**
 * MessageCenter — customer support chat for logged-in users.
 * Route: /messages
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth }             from "../context/AuthContext";
import {
  getMyConversation,
  sendMessage,
  markUserMessagesRead,
  getMessageSettings,
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

/* ── Message bubble ── */
const Bubble = ({ msg, userInitial }) => {
  const isUser = msg.sender === "user";
  return (
    <div className={`mc-bubble-row mc-bubble-row--${isUser ? "user" : "admin"}`}>
      <div className={`mc-bubble-avatar mc-bubble-avatar--${isUser ? "user" : "admin"}`}>
        {isUser ? userInitial : "🛒"}
      </div>
      <div className={`mc-bubble mc-bubble--${isUser ? "user" : "admin"}`}>
        {msg.text}
        <div className="mc-bubble-meta">
          <span>{timeAgo(msg.createdAt)}</span>
          {isUser && <span className="mc-read-tick">{msg.isRead ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
};

/* ── Date divider ── */
const DateDivider = ({ date }) => (
  <div className="mc-date-divider">
    <span>{fmtDate(date)}</span>
  </div>
);

/* ── Main component ── */
const MessageCenter = () => {
  const { user }             = useAuth();
  const messagesEndRef       = useRef(null);
  const textareaRef          = useRef(null);

  const [conv,     setConv]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [text,     setText]     = useState("");
  const [subject,  setSubject]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sendErr,  setSendErr]  = useState("");
  const [enabled,  setEnabled]  = useState(true); // feature flag

  const userInitial = (user?.fullName || "U").charAt(0).toUpperCase();

  /* ── Load / poll ── */
  const load = useCallback(async () => {
    try {
      // Check feature flag first
      const settings = await getMessageSettings();
      setEnabled(settings.messageCenterEnabled);
      if (!settings.messageCenterEnabled) { setLoading(false); return; }

      const data = await getMyConversation();
      setConv(data.conversation);
      if (data.conversation?.unreadByUser > 0) {
        markUserMessagesRead().catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 15 s for new admin replies
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages?.length]);

  /* ── Send ── */
  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      setSendErr("");
      const data = await sendMessage(text.trim(), conv ? "" : subject.trim() || "Support Request");
      setConv(data.conversation);
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    } catch (err) {
      setSendErr(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-grow textarea
    e.target.style.height = "44px";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  /* ── Render helpers ── */
  const renderMessages = () => {
    if (!conv?.messages?.length) return (
      <div className="mc-empty-chat">
        <span className="mc-empty-chat-icon">💬</span>
        <p>No messages yet</p>
        <span>Send your first message below and our support team will reply soon.</span>
      </div>
    );

    let lastDate = null;
    return conv.messages.map((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDiv = msgDate !== lastDate;
      lastDate = msgDate;
      return (
        <div key={msg._id}>
          {showDiv && <DateDivider date={msg.createdAt} />}
          <Bubble msg={msg} userInitial={userInitial} />
        </div>
      );
    });
  };

  if (loading) return <div className="mc-page"><div className="mc-loading">Loading messages…</div></div>;
  if (error)   return <div className="mc-page"><div className="mc-error">{error}</div></div>;

  /* ── Feature disabled screen ── */
  if (!enabled) return (
    <div className="mc-page">
      <div className="mc-header">
        <div>
          <h1>Message Center</h1>
          <p>Customer support chat</p>
        </div>
      </div>
      <div className="mc-chat-box">
        <div className="mc-chat-header">
          <div className="mc-chat-header-left">
            <div className="mc-support-avatar">🛒</div>
            <div>
              <span className="mc-chat-title">OICT_TechStore Support</span>
              <span className="mc-chat-sub">Currently unavailable</span>
            </div>
          </div>
          <span className="mc-status-chip mc-status-chip--closed">Offline</span>
        </div>
        <div className="mc-empty-chat" style={{ flex: 1 }}>
          <span className="mc-empty-chat-icon">🔕</span>
          <p style={{ fontWeight: 700, color: "#374151" }}>Message Center is temporarily disabled</p>
          <span>Our support chat is currently unavailable. Please try again later or contact us via email.</span>
        </div>
      </div>
    </div>
  );

  const isClosed = conv?.status === "closed";

  return (
    <div className="mc-page">
      <div className="mc-header">
        <div>
          <h1>Message Center</h1>
          <p>Chat with OICT_TechStore support · We reply within 24 hours</p>
        </div>
      </div>

      {/* Subject input — only if no conversation yet */}
      {!conv && (
        <div className="mc-subject-row">
          <input
            className="mc-subject-input"
            type="text"
            placeholder="Subject (optional, e.g. Order issue, Payment question…)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
          />
        </div>
      )}

      <div className="mc-chat-box">
        {/* Header */}
        <div className="mc-chat-header">
          <div className="mc-chat-header-left">
            <div className="mc-support-avatar">🛒</div>
            <div>
              <span className="mc-chat-title">OICT_TechStore Support</span>
              <span className="mc-chat-sub">
                {conv?.subject || "Support Chat"} · {conv?.messages?.length || 0} message{conv?.messages?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {conv && (
            <span className={`mc-status-chip mc-status-chip--${conv.status}`}>
              {conv.status === "open" ? "Open" : "Closed"}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="mc-messages">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        {/* Send error */}
        {sendErr && (
          <div style={{ padding: "8px 16px", background: "#FEF2F2", color: "#991B1B", fontSize: 13 }}>
            {sendErr}
          </div>
        )}

        {/* Input area */}
        {isClosed ? (
          <div className="mc-closed-notice">
            This conversation has been closed by support. <br />
            <button
              style={{ marginTop: 6, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              onClick={() => setConv((p) => p ? { ...p, status: "open" } : p)}
            >
              Start a new message
            </button>
          </div>
        ) : (
          <div className="mc-input-area">
            <textarea
              ref={textareaRef}
              className="mc-textarea"
              rows={1}
              placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button className="mc-send-btn" onClick={handleSend} disabled={sending || !text.trim()} aria-label="Send">
              {sending ? "…" : "➤"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
