import api from "./api";

/** GET /api/notifications — paginated list for the logged-in user */
export const getNotifications = async (params = {}) => {
  const { data } = await api.get("/notifications", { params });
  return data;
};

/** GET /api/notifications/unread-count — lightweight poll */
export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread-count");
  return data;
};

/** PATCH /api/notifications/:id/read */
export const markAsRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

/** PATCH /api/notifications/mark-all-read */
export const markAllAsRead = async () => {
  const { data } = await api.patch("/notifications/mark-all-read");
  return data;
};

/** DELETE /api/notifications/:id */
export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

/** DELETE /api/notifications — clear all */
export const clearAllNotifications = async () => {
  const { data } = await api.delete("/notifications");
  return data;
};
