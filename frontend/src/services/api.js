import axios from "axios";

// Single source of truth for the API URL.
// Vercel must have VITE_API_URL set as an Environment Variable
// (e.g. https://e-commerce-techstore-y26d.onrender.com/api).
// The fallback is the deployed Render URL so the app still works if the
// Vercel env var is accidentally missing.
const API_URL = import.meta.env.VITE_API_URL || "https://e-commerce-techstore-y26d.onrender.com/api";

// Base URL for images served from the backend (/uploads/*)
// Strip the trailing "/api" from the API URL.
export const BASE_URL = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch {
    // malformed localStorage — ignore
  }
  return config;
});

// Handle 401 globally — token expired / invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
