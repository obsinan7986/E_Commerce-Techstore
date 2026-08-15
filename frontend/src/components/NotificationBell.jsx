/**
 * NotificationBell
 * - Sits in the Navbar between Wishlist and Account
 * - Shows unread count badge
 * - Opens a dropdown with the latest 10 notifications
 * - Mark all read / clear all / individual delete from dropdown
 * - "View all" goes to /notifications
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate }                         from "react-router-dom";
import { FaBell }                                    from "react-icons/fa";
import { useNotifications }                          from "../context/NotificationContext";
import { useAuth }                                   from "../context/AuthContext";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../services/notificationService";
import "../styles/notification.css";

/* ── Icon map by notification type ── */
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
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const NotificationBell = () => {
  const { user }                              = useAuth();
  const { unreadCount, refreshCount, markAllRead, setUnreadCount } = useNotifications();
  const navigate                              = useNavigate();

  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef               = useRef(null);

  /* ── Load latest 10 when panel opens ── */
  const loadDropdown = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 10, page: 1 });
      setItems(data.notifications || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (open) loadDropdown();
  }, [open, loadDropdown]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn, true);
    return () => document.removeEventListener("mousedown", fn, true);
  }, [open]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open]);

  /* ── Don't render when logged out ── */
  if (!user) return null;

  /* ── Mark one as read then navigate ── */
  const handleClick = async (notif) => {
    setOpen(false);
    if (!notif.isRead) {
      await markAsRead(notif._id).catch(() => {});
      setItems((p) => p.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) navigate(notif.link);
  };

  /* ── Delete one ── */
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteNotification(id).catch(() => {});
    const removed = items.find((n) => n._id === id);
    setItems((p) => p.filter((n) => n._id !== id));
    if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  };

  /* ── Mark all read ── */
  const handleMarkAll = async () => {
    await markAllRead();
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
  };

  /* ── Clear all ── */
  const handleClear = async () => {
    await clearAllNotifications().catch(() => {});
    setItems([]);
    setUnreadCount(0);
    refreshCount();
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      {/* ── Bell button ── */}
      <button
        type="button"
        className="notif-bell-btn header-icon-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        <FaBell style={{ fontSize: 19 }} />
        <span className="icon-label">Alerts</span>
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">{displayCount}</span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          {/* Header */}
          <div className="notif-panel-header">
            <span className="notif-panel-title">
              Notifications
              {unreadCount > 0 && (
                <span className="notif-panel-unread-chip">{displayCount}</span>
              )}
            </span>
            <div className="notif-panel-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn notif-action-btn--mark" onClick={handleMarkAll}>
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button className="notif-action-btn notif-action-btn--clear" onClick={handleClear}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="notif-list">
            {loading ? (
              <div className="notif-loading">Loading…</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <span>No notifications yet</span>
              </div>
            ) : (
              items.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item${notif.isRead ? "" : " notif-item--unread"}`}
                  onClick={() => handleClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") handleClick(notif); }}
                >
                  <div className={`notif-icon notif-icon--${notif.type}`}>
                    {TYPE_ICON[notif.type] || "🔔"}
                  </div>
                  <div className="notif-text">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <span className="notif-unread-dot" aria-hidden="true" />}
                  <button
                    className="notif-delete-btn"
                    aria-label="Delete notification"
                    onClick={(e) => handleDelete(e, notif._id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-panel-footer">
            <Link
              to="/notifications"
              className="notif-footer-link"
              onClick={() => setOpen(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
