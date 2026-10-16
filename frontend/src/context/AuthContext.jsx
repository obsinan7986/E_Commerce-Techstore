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

  // true while the profile refresh is in-flight on mount
  // AdminRoute and ProtectedRoute wait for this before rendering
  const [loading, setLoading] = useState(true);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  /**
   * Refreshes user profile and permissions directly from MongoDB
   */
  const refreshProfile = async () => {
    try {
      const saved = localStorage.getItem("user");
      if (!saved) return null;

      const cached = JSON.parse(saved);
      if (!cached?.token) return null;

      const { data } = await api.get("/auth/profile");
      const updated = { ...cached, ...data, token: cached.token };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem("user");
      }
      return null;
    }
  };

  /**
   * On every app boot: silently re-validate the stored token by hitting
   * GET /api/auth/profile.  This keeps isAdmin (and role) fresh from DB.
   * If the token is expired/invalid we clear the stale session.
   */
  useEffect(() => {
    refreshProfile().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        refreshProfile,
        isAuthenticated: !!user,
        isAdmin:   !!(user?.isAdmin),
        isOwner:   user?.role === "owner",
        isSeller:  user?.role === "seller",
        isFinance: user?.role === "finance",
        role:      user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
