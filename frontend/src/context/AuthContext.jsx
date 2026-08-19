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
   * On every app boot: silently re-validate the stored token by hitting
   * GET /api/auth/profile.  This keeps isAdmin (and role) fresh from DB.
   * If the token is expired/invalid we clear the stale session.
   */
  useEffect(() => {
    const refresh = async () => {
      try {
        const saved = localStorage.getItem("user");
        if (!saved) { setLoading(false); return; }

        const cached = JSON.parse(saved);
        if (!cached?.token) { setLoading(false); return; }

        const { data } = await api.get("/auth/profile");

        const updated = { ...data, token: cached.token };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (err) {
        if (err.response?.status === 401) {
          setUser(null);
          localStorage.removeItem("user");
        }
        // Network errors → keep cached state, still clear loading
      } finally {
        setLoading(false);
      }
    };

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
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
