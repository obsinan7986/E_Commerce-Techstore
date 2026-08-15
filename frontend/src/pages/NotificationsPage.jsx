/**
 * Full notifications page — /notifications
 * Shows all notifications with filter tabs (All / Unread / Read)
 * Pagination, mark-read on click, delete, clear all.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate }                       from "react-router-dom";
import { useNotifications }                  from "../context/NotificationContext";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../services/notificationService";
import "../styles/notification.css";

const TYPE_ICON = {
  order_placed:      "🛍️",
  payment_verified:  "✅",
  payment_rejected:  "❌",
  order_confirmed:   "🎉",
  order_processing:  "⚙️",
  order_shipped:     "🚚",
  order_delivered:   "📦",
  order_cancelled:   "✕",
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { dateStyle: "medium" });
};

const NotificationsPage = () => {
  const navigate                          = useNavigate();
  const { refreshCount, setUnreadCount }  = useNotifications();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [tab,     setTab]     = useState("all"); // all | unread | read
  const [msg,     setMsg]     = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (tab === "unread") params.unreadOnly = "true";
      const data = await getNotifications(params);
      let list = data.notifications || [];
      if (tab === "read") list = list.filter((n) => n.isRead);
      setItems(list);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, tab]);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (t) => { setTab(t); setPage(1); };

  /* Mark one as read + navigate */
  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id).catch(() => {});
      setItems((p) => p.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) navigate(notif.link);
  };

  /* Delete one */
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const removed = items.find((n) => n._id === id);
    await deleteNotification(id).catch(() => {});
    setItems((p) => p.filter((n) => n._id !== id));
    if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  };

  /* Mark all read */
  const handleMarkAll = async () => {
    await markAllAsRead().catch(() => {});
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setMsg("All notifications marked as read.");
    setTimeout(() => setMsg(""), 3000);
  };

  /* Clear all */
  const handleClear = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    await clearAllNotifications().catch(() => {});
    setItems([]);
    setTotal(0);
    setUnreadCount(0);
    refreshCount();
    setMsg("All notifications cleared.");
    setTimeout(() => setMsg(""), 3000);
  };

  const unreadInList = items.filter((n) => !n.isRead).length;

  return (
    <div className="notifpage">
      <div className="notifpage-header">
        <div>
          <h1>Notifications</h1>
          <p>{total} notification{total !== 1 ? "s" : ""} total</p>
        </div>
        <div className="notifpage-header-actions">
          {unreadInList > 0 && (
            <button className="notifpage-btn notifpage-btn--mark" onClick={handleMarkAll}>
              ✓ Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button className="notifpage-btn notifpage-btn--clear" onClick={handleClear}>
              🗑 Clear all
            </button>
          )}
        </div>
      </div>

      {/* Feedback message */}
      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#DCFCE7", color: "#166534", marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="notifpage-tabs">
        {[
          { key: "all",    label: "All"    },
          { key: "unread", label: "Unread" },
          { key: "read",   label: "Read"   },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`notifpage-tab${tab === key ? " notifpage-tab--active" : ""}`}
            onClick={() => handleTabChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="notifpage-loading">Loading notifications…</div>
      ) : items.length === 0 ? (
        <div className="notifpage-empty">
          <span className="notifpage-empty-icon">🔔</span>
          <p>No {tab === "all" ? "" : tab} notifications.</p>
        </div>
      ) : (
        <div className="notifpage-list">
          {items.map((notif) => (
            <div
              key={notif._id}
              className={`notifpage-item${notif.isRead ? "" : " notifpage-item--unread"}`}
              onClick={() => handleClick(notif)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") handleClick(notif); }}
            >
              <div className={`notifpage-icon notif-icon--${notif.type}`}>
                {TYPE_ICON[notif.type] || "🔔"}
              </div>
              <div className="notifpage-text">
                <p className="notifpage-item-title">{notif.title}</p>
                <p className="notifpage-item-message">{notif.message}</p>
                <span className="notifpage-item-time">
                  {new Date(notif.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {timeAgo(notif.createdAt)}
                </span>
              </div>
              {!notif.isRead && <span className="notifpage-unread-dot" aria-hidden="true" />}
              <button
                className="notifpage-item-delete"
                aria-label="Delete"
                onClick={(e) => handleDelete(e, notif._id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="notifpage-pagination">
          <button disabled={page <= 1}  onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
