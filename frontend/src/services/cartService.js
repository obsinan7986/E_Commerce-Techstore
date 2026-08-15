import api from "./api";

// Add product to cart
export const addToCart = async (productId, quantity = 1) => {
  const { data } = await api.post("/cart", {
    productId,
    quantity,
  });

  return data;
};

// Get logged-in user's cart
export const getCart = async () => {
  const { data } = await api.get("/cart");
  return data;
};

// Update quantity
export const updateCartItem = async (productId, quantity) => {
  const { data } = await api.put(`/cart/${productId}`, {
    quantity,
  });

  return data;
};

// Remove item
export const removeCartItem = async (productId) => {
  const { data } = await api.delete(`/cart/${productId}`);

  return data;
};

// Clear cart
export const clearCart = async () => {
  const { data } = await api.delete("/cart");

  return data;
};