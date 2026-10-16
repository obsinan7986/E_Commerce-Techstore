import axios from "axios";

// Single source of truth for the API URL.
// Vercel should have VITE_API_URL set as an Environment Variable.
// Fallback defaults to local dev server http://localhost:5000/api.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  // Allow browser to automatically set multipart/form-data boundary for file uploads
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
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
