import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Persist user changes ──
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  /**
   * Silently refresh user data from the server on app boot.
   * This keeps isAdmin (and other fields) in sync with the DB.
   * If the token is expired or the user is deleted, we log them out.
   */
  useEffect(() => {
    const refresh = async () => {
      try {
        const saved = localStorage.getItem("user");
        if (!saved) return;

        const cached = JSON.parse(saved);
        if (!cached?.token) return;

        // Call GET /api/auth/profile with the stored token
        const { data } = await api.get("/auth/profile");

        // Merge fresh DB data with the stored token
        const updated = {
          ...data,
          token: cached.token,
        };

        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (err) {
        // 401 = token expired/invalid → clear stale session
        if (err.response?.status === 401) {
          setUser(null);
          localStorage.removeItem("user");
        }
        // Other errors (network) → keep existing cached state
      }
    };

    refresh();
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: !!(user?.isAdmin),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
