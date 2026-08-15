import api from "./api";

// Add product
export const addToWishlist = async (productId) => {
  const { data } = await api.post("/wishlist", {
    productId,
  });

  return data;
};

// Get wishlist
export const getWishlist = async () => {
  const { data } = await api.get("/wishlist");

  return data;
};

// Remove product
export const removeFromWishlist = async (productId) => {
  const { data } = await api.delete(`/wishlist/${productId}`);

  return data;
};