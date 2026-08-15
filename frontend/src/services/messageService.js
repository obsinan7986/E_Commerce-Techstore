import api from "./api";

/* ── Settings ── */
export const getMessageSettings  = async ()          => { const { data } = await api.get("/messages/settings");                         return data; };
export const toggleMessageCenter = async (enabled)   => { const { data } = await api.patch("/messages/admin/settings", { enabled });    return data; };

/* ── Customer ── */
export const getMyConversation     = async ()          => { const { data } = await api.get("/messages/mine");             return data; };
export const sendMessage           = async (text, subject = "") => { const { data } = await api.post("/messages", { text, subject }); return data; };
export const markUserMessagesRead  = async ()          => { const { data } = await api.patch("/messages/mine/read");       return data; };
export const getUserUnreadCount    = async ()          => { const { data } = await api.get("/messages/mine/unread-count"); return data; };

/* ── Admin ── */
export const getAllConversations   = async (params = {})   => { const { data } = await api.get("/messages/admin", { params });              return data; };
export const getConversationById  = async (id)             => { const { data } = await api.get(`/messages/admin/${id}`);                    return data; };
export const adminReply           = async (id, text)       => { const { data } = await api.post(`/messages/admin/${id}/reply`, { text });   return data; };
export const adminMarkRead        = async (id)             => { const { data } = await api.patch(`/messages/admin/${id}/read`);             return data; };
export const closeConversation    = async (id)             => { const { data } = await api.patch(`/messages/admin/${id}/close`);            return data; };
export const deleteConversation   = async (id)             => { const { data } = await api.delete(`/messages/admin/${id}`);                 return data; };
export const getAdminUnreadCount  = async ()               => { const { data } = await api.get("/messages/admin/unread-count");             return data; };
