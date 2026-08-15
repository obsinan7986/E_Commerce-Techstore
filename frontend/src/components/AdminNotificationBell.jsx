/**
 * AdminNotificationBell
 * Shows in the AdminDashboard header (and any admin page using it).
 * Polls admin unread-count, opens a dropdown with latest 10 notifications.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate }                         from "react-router-dom";
import { FaBell }                                    from "react-icons/fa";
import { useAdminNotifications }                     from "../context/AdminNotificationContext";
import {
  getAdminNotifications,
  markAdminNotifAsRead,
  deleteAdminNotif,
  clearAllAdminNotifs,
} from "../services/adminNotificationService";
import "../styles/notification.css";

const TYPE_ICON = {
  admin_new_user:            "👤",
  admin_new_order:           "🛍️",
  admin_payment_screenshot:  "📸",
  admin_new_message:         "💬",
  admin_new_review:          "⭐",
  admin_order_cancelled:     "❌",
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const AdminNotificationBell = () => {
  const { unreadCount, refreshCount, markAllRead, setUnreadCount } = useAdminNotifications();
  const navigate = useNavigate();

  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const loadDropdown = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminNotifications({ limit: 10, page: 1 });
      setItems(data.notifications || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) loadDropdown(); }, [open, loadDropdown]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn, true);
    return () => document.removeEventListener("mousedown", fn, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open]);

  const handleClick = async (notif) => {
    setOpen(false);
    if (!notif.isRead) {
      await markAdminNotifAsRead(notif._id).catch(() => {});
      setItems((p) => p.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) navigate(notif.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteAdminNotif(id).catch(() => {});
    const removed = items.find((n) => n._id === id);
    setItems((p) => p.filter((n) => n._id !== id));
    if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
  };

  const handleClear = async () => {
    await clearAllAdminNotifs().catch(() => {});
    setItems([]);
    setUnreadCount(0);
    refreshCount();
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell-btn header-icon-btn"
        aria-label={`Admin notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        style={{ color: "#111827" }}
      >
        <FaBell style={{ fontSize: 19 }} />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">{displayCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Admin notifications" style={{ right: 0, minWidth: 340 }}>
          <div className="notif-panel-header">
            <span className="notif-panel-title">
              Admin Alerts
              {unreadCount > 0 && <span className="notif-panel-unread-chip">{displayCount}</span>}
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

          <div className="notif-list">
            {loading ? (
              <div className="notif-loading">Loading…</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <span>No admin notifications</span>
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
                  <div className={`notif-icon notif-icon--${notif.type}`} style={{ background: "#F3F4F6", fontSize: 18 }}>
                    {TYPE_ICON[notif.type] || "🔔"}
                  </div>
                  <div className="notif-text">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <span className="notif-unread-dot" aria-hidden="true" />}
                  <button className="notif-delete-btn" aria-label="Delete" onClick={(e) => handleDelete(e, notif._id)}>✕</button>
                </div>
              ))
            )}
          </div>

          <div className="notif-panel-footer">
            <Link to="/admin/notifications" className="notif-footer-link" onClick={() => setOpen(false)}>
              View all admin alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
