import api from "./api";

/** POST /api/coupons/apply — validate coupon, get discount info */
export const applyCoupon = async (code, subtotal) => {
  const { data } = await api.post("/coupons/apply", { code, subtotal });
  return data;
};

/** GET /api/coupons/first-order-check — is this user eligible for 10% first-order discount? */
export const checkFirstOrderDiscount = async () => {
  const { data } = await api.get("/coupons/first-order-check");
  return data;
};

// ── Admin ──────────────────────────────────────────────────────────

export const getAdminCoupons = async (params = {}) => {
  const { data } = await api.get("/coupons", { params });
  return data;
};

export const createAdminCoupon = async (payload) => {
  const { data } = await api.post("/coupons", payload);
  return data;
};

export const updateAdminCoupon = async (id, payload) => {
  const { data } = await api.put(`/coupons/${id}`, payload);
  return data;
};

export const deleteAdminCoupon = async (id) => {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
};
