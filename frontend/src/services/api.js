import axios from "axios";

// Single source of truth for the API URL.
// Vercel should have VITE_API_URL set as an Environment Variable.
// Fallback defaults to local dev server http://localhost:5000/api.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Base URL for images served from the backend (/uploads/*)
// Strip the trailing "/api" from the API URL.
export const BASE_URL = API_URL.replace(/\/api\/?$/, "");

let activeRequests = 0;
let wakeTimer = null;

function showWakeupBanner() {
  if (typeof document === "undefined") return;
  let el = document.getElementById("server-wakeup-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "server-wakeup-banner";
    el.innerHTML = "<span>⏳ Server is waking up, please wait...</span>";
    Object.assign(el.style, {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      padding: "10px 22px",
      borderRadius: "9999px",
      fontSize: "0.88rem",
      fontWeight: "600",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      zIndex: "999999",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "1px solid #334155",
      transition: "opacity 0.3s ease",
    });
    document.body.appendChild(el);
  }
}

function hideWakeupBanner() {
  if (wakeTimer) {
    clearTimeout(wakeTimer);
    wakeTimer = null;
  }
  if (typeof document !== "undefined") {
    const el = document.getElementById("server-wakeup-banner");
    if (el) el.remove();
  }
}

function onRequestStart() {
  activeRequests++;
  if (activeRequests === 1 && !wakeTimer) {
    wakeTimer = setTimeout(() => {
      if (activeRequests > 0) {
        showWakeupBanner();
      }
    }, 4000);
  }
}

function onRequestEnd() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    hideWakeupBanner();
  }
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    onRequestStart();

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
  },
  (error) => {
    onRequestEnd();
    return Promise.reject(error);
  }
);

// Handle retry & 401 globally
api.interceptors.response.use(
  (response) => {
    onRequestEnd();
    return response;
  },
  async (error) => {
    onRequestEnd();

    const config = error.config;
    const method = config?.method?.toLowerCase();
    const isNetworkError = !error.response;
    const status = error.response?.status;

    // Retry GET requests once on network error or 502/503/504
    if (config && method === "get" && !config._retry) {
      if (isNetworkError || status === 502 || status === 503 || status === 504) {
        config._retry = true;
        return api(config);
      }
    }

    // Handle 401 globally — token expired / invalid / missing
    if (status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        const msg = error.response?.data?.message || "";
        // If technical "Not authorized, no token" or unauthorized consumer action, cleanly redirect to /register
        if (
          msg.includes("Not authorized") ||
          msg.includes("no token") ||
          (!currentPath.startsWith("/admin") &&
            !currentPath.startsWith("/owner") &&
            !currentPath.startsWith("/finance"))
        ) {
          window.location.href = `/register?from=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
