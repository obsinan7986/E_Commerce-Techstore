import api from "./api";

// Create order
export const createOrder = async (orderData) => {
  const { data } = await api.post("/orders", orderData);
  return data;
};

// Get logged-in user's orders
export const getMyOrders = async () => {
  const { data } = await api.get("/orders/my-orders");
  return data;
};

// Get single order
export const getOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

// Cancel order
export const cancelOrder = async (id) => {
  const { data } = await api.put(`/orders/${id}/cancel`);
  return data;
};