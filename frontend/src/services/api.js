import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://e-commerce-techstore-y26d.onrender.com/api",
});

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

// Handle 401 globally — token expired/invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale user session
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem("user");
        // Let individual components handle redirect via AuthContext
      }
    }
    return Promise.reject(error);
  }
);

export default api;
