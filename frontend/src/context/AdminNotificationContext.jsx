/**
 * AdminNotificationContext
 * Polls admin unread-count every 30s when the logged-in user is an admin.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getAdminUnreadNotifCount, markAllAdminNotifsRead } from "../services/adminNotificationService";

const AdminNotificationContext = createContext(null);
const POLL_INTERVAL = 30_000;

export const AdminNotificationProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!user || !isAdmin) { setUnreadCount(0); return; }
    try {
      const data = await getAdminUnreadNotifCount();
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) { setUnreadCount(0); return; }
    refreshCount();
    timerRef.current = setInterval(refreshCount, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [user, isAdmin, refreshCount]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAdminNotifsRead();
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  return (
    <AdminNotificationContext.Provider value={{ unreadCount, refreshCount, markAllRead, setUnreadCount }}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) throw new Error("useAdminNotifications must be used inside AdminNotificationProvider");
  return ctx;
};
