import api from "./api";

// Get all categories
export const getCategories = async () => {
  const { data } = await api.get("/products/categories");
  return data;
};

// Get products by category
export const getCategoryProducts = async (category) => {
  const { data } = await api.get(`/products/category/${category}`);

  // because backend returns:
  // {
  //   success: true,
  //   products: [...]
  // }

  return data;
};