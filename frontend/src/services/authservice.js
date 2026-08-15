import api from "./api";

export const register = async (userData) => {
  const { data } = await api.post("/auth/register", userData);
  return data;
};

export const login = async (userData) => {
  const { data } = await api.post("/auth/login", userData);
  return data;
};
