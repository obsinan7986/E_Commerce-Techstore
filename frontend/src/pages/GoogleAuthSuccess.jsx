/**
 * GoogleAuthSuccess
 * Landing page after Google OAuth callback.
 * Backend redirects here with base64-encoded user data in ?data=
 * This page decodes it, saves to localStorage + AuthContext, then
 * redirects to the intended destination.
 */
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const { loadCartCount } = useCart();

  useEffect(() => {
    const data = searchParams.get("data");
    const error = searchParams.get("error");

    if (error || !data) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    try {
      // Decode the base64url payload sent by the backend
      const decoded = JSON.parse(
        atob(data.replace(/-/g, "+").replace(/_/g, "/"))
      );

      // Save to AuthContext + localStorage (same as email/password login)
      login(decoded);
      loadCartCount().catch(() => {});

      // Redirect admins to dashboard, customers to home
      if (decoded.isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, []); // eslint-disable-line

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
      fontSize: 16,
      color: "#6B7280",
    }}>
      <span style={{ fontSize: 36 }}>🔄</span>
      <span>Signing you in with Google…</span>
    </div>
  );
};

export default GoogleAuthSuccess;
