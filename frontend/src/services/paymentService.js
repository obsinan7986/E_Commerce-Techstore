import api from "./api";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

// ── Chapa ─────────────────────────────────────────────────────────────
export const initializeChapaPayment = async ({ orderId, firstName, lastName, email, phone }) => {
  const { data } = await api.post("/payments/chapa/initialize", { orderId, firstName, lastName, email, phone });
  return data;
};

export const verifyChapaPayment = async (txRef) => {
  const { data } = await api.get(`/payments/chapa/verify/${encodeURIComponent(txRef)}`);
  return data;
};

// ── Payment settings (bank QR code) ──────────────────────────────────
export const getPaymentSettings = async () => {
  const { data } = await api.get("/payments/settings");
  return data;
};

/** Admin only — multipart/form-data. Pass a FormData object. */
export const updatePaymentSettings = async (formData) => {
  const { data } = await api.put("/payments/settings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Manual payment screenshot (customer) ─────────────────────────────
/** orderId: string, screenshotFile: File */
export const uploadPaymentScreenshot = async (orderId, screenshotFile) => {
  const fd = new FormData();
  fd.append("screenshot", screenshotFile);
  const { data } = await api.post(`/payments/screenshot/${orderId}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Admin manual verification ─────────────────────────────────────────
export const getPendingManualPayments = async (params = {}) => {
  const { data } = await api.get("/payments/manual/pending", { params });
  return data;
};

export const getManualPaymentStats = async () => {
  const { data } = await api.get("/payments/manual/stats");
  return data;
};

/** action: "verify" | "reject",  adminNote?: string */
export const verifyManualPayment = async (orderId, action, adminNote = "") => {
  const { data } = await api.put(`/payments/manual/${orderId}/verify`, { action, adminNote });
  return data;
};

export { BASE };
