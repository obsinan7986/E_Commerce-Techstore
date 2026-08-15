import api from "./api";

/** GET /api/reviews/:productId — paginated, with breakdown */
export const getReviews = async (productId, params = {}) => {
  const { data } = await api.get(`/reviews/${productId}`, { params });
  return data;
};

/** GET /api/reviews/check/:productId — can logged-in user review? */
export const checkCanReview = async (productId) => {
  const { data } = await api.get(`/reviews/check/${productId}`);
  return data;
};

/** POST /api/reviews */
export const createReview = async ({ productId, rating, title, comment }) => {
  const { data } = await api.post("/reviews", { productId, rating, title, comment });
  return data;
};

/** PUT /api/reviews/:id */
export const updateReview = async (id, { rating, title, comment }) => {
  const { data } = await api.put(`/reviews/${id}`, { rating, title, comment });
  return data;
};

/** DELETE /api/reviews/:id */
export const deleteReview = async (id) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
};
