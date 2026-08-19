import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OwnerRoute = () => {
  const { isAuthenticated, isOwner, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 16, color: "#6B7280" }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isOwner)         return <Navigate to="/"      replace />;

  return <Outlet />;
};

export default OwnerRoute;
