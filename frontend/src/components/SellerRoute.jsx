import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SellerRoute = () => {
  const { isAuthenticated, isSeller, isOwner, loading, refreshProfile } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [attemptedRefresh, setAttemptedRefresh] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (isAuthenticated && !isSeller && !isOwner && !attemptedRefresh && refreshProfile) {
      setChecking(true);
      refreshProfile().finally(() => {
        if (mounted) {
          setAttemptedRefresh(true);
          setChecking(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isSeller, isOwner, attemptedRefresh, refreshProfile]);

  if (loading || checking) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 16, color: "#6B7280" }}>
        Loading Seller Center…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Owner can access seller pages too
  if (!isSeller && !isOwner) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default SellerRoute;
