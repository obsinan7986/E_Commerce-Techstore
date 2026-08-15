import api from "./api";

export const getAdminNotifications      = async (params = {}) => { const { data } = await api.get("/notifications/admin",                { params }); return data; };
export const getAdminUnreadNotifCount   = async ()             => { const { data } = await api.get("/notifications/admin/unread-count");             return data; };
export const markAdminNotifAsRead       = async (id)           => { const { data } = await api.patch(`/notifications/admin/${id}/read`);             return data; };
export const markAllAdminNotifsRead     = async ()             => { const { data } = await api.patch("/notifications/admin/mark-all-read");          return data; };
export const deleteAdminNotif           = async (id)           => { const { data } = await api.delete(`/notifications/admin/${id}`);                 return data; };
export const clearAllAdminNotifs        = async ()             => { const { data } = await api.delete("/notifications/admin");                        return data; };
