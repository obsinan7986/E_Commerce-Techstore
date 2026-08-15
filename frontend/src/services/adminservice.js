import api from "./api";

// ==========================================
// DASHBOARD
// ==========================================

export const getAdminDashboard = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data;
};

export const getAnalytics = async () => {
  const { data } = await api.get("/admin/analytics");
  return data;
};

export const getSalesReport = async () => {
  const { data } = await api.get("/admin/sales-report");
  return data;
};

export const getMonthlySales = async () => {
  const { data } = await api.get("/admin/monthly-sales");
  return data;
};

export const getProductStatistics = async () => {
  const { data } = await api.get("/admin/product-statistics");
  return data;
};

export const getLowStockProducts = async () => {
  const { data } = await api.get("/admin/low-stock");
  return data;
};

// ==========================================
// ORDERS (admin)
// ==========================================

/**
 * @param {Object} params - { page, limit, keyword, orderStatus, paymentStatus, paymentMethod, sort, startDate, endDate }
 */
export const getAdminOrders = async (params = {}) => {
  const { data } = await api.get("/admin/orders", { params });
  return data;
};

export const getAdminOrderById = async (id) => {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data;
};

/**
 * @param {string} id - order id
 * @param {string} orderStatus - one of Pending|Processing|Shipped|Delivered
 */
export const updateOrderStatus = async (id, orderStatus) => {
  const { data } = await api.put(`/admin/orders/${id}/status`, { orderStatus });
  return data;
};

export const adminCancelOrder = async (id) => {
  const { data } = await api.put(`/admin/orders/${id}/cancel`);
  return data;
};

// ==========================================
// PRODUCTS (admin)
// ==========================================

/**
 * @param {Object} params - { page, limit, keyword, category, stockFilter, sort }
 */
export const getAdminProducts = async (params = {}) => {
  const { data } = await api.get("/admin/products", { params });
  return data;
};

export const createAdminProduct = async (productData) => {
  const { data } = await api.post("/admin/products", productData);
  return data;
};

export const updateAdminProduct = async (id, productData) => {
  const { data } = await api.put(`/admin/products/${id}`, productData);
  return data;
};

export const updateAdminProductStock = async (id, stock) => {
  const { data } = await api.patch(`/admin/products/${id}/stock`, { stock });
  return data;
};

export const deleteAdminProduct = async (id) => {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
};

// ==========================================
// CATEGORIES (admin - read-only stats)
// ==========================================

export const getAdminCategories = async (params = {}) => {
  const { data } = await api.get("/admin/categories", { params });
  return data;
};

// ==========================================
// USERS (admin)
// ==========================================

/**
 * @param {Object} params - { page, limit, keyword, role }
 */
export const getAdminUsers = async (params = {}) => {
  const { data } = await api.get("/admin/users", { params });
  return data;
};

export const getAdminUserById = async (id) => {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
};

/**
 * Update a user's role.
 * @param {string} id
 * @param {string} role - "customer" | "admin"
 */
export const updateAdminUser = async (id, role) => {
  const { data } = await api.put(`/admin/users/${id}/role`, { role });
  return data;
};

export const deleteAdminUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

// ==========================================
// CUSTOMERS (admin)
// ==========================================

export const getAdminCustomers = async (params = {}) => {
  const { data } = await api.get("/admin/customers", { params });
  return data;
};

// ==========================================
// PAYMENTS (admin)
// ==========================================

export const getAdminPayments = async (params = {}) => {
  const { data } = await api.get("/admin/payments", { params });
  return data;
};
