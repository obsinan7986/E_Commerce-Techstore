/**
 * NotificationContext
 * - Polls unread-count every 30 s when the user is logged in
 * - Exposes: unreadCount, refreshCount, markAllRead
 * - Full list is loaded lazily by the bell dropdown / notifications page
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUnreadCount, markAllAsRead } from "../services/notificationService";

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30_000; // 30 seconds

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // silently ignore — network errors shouldn't break the UI
    }
  }, [user]);

  // Poll while logged in
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    refreshCount();                            // immediate fetch
    timerRef.current = setInterval(refreshCount, POLL_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [user, refreshCount]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, markAllRead, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
