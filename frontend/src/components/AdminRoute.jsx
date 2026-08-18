import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Wait for the profile refresh to finish before making a decision.
  // Without this, a hard-refresh on an admin page would briefly see
  // isAdmin=false (because the async profile fetch hasn't returned yet)
  // and redirect the admin to "/" incorrectly.
  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        color: "#6B7280",
      }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
