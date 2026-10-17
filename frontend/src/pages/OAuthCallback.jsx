/**
 * OAuthCallback
 * Landing page after Google OAuth 2.0 callback.
 * Reads ?token= from the URL, fetches /api/auth/profile,
 * saves user + token into localStorage and AuthContext,
 * and redirects to the appropriate dashboard / home page.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadCartCount } = useCart();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const dataParam = searchParams.get("data");
    const error = searchParams.get("error");

    if (error) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    // 1. If standard JWT token parameter exists
    if (token) {
      const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000/api";
      axios
        .get(`${apiUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const profile = res.data;
          const userSession = {
            ...profile,
            token,
          };
          login(userSession);
          loadCartCount().catch(() => {});

          if (userSession.isAdmin || userSession.role === "owner" || userSession.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (userSession.role === "seller") {
            navigate("/seller/dashboard", { replace: true });
          } else if (userSession.role === "finance") {
            navigate("/finance/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        })
        .catch((err) => {
          console.error("[OAuthCallback] Profile fetch failed:", err);
          setErrorMsg("Failed to authenticate session with Google. Redirecting to login...");
          setTimeout(() => {
            navigate("/login?error=google_failed", { replace: true });
          }, 1500);
        });
      return;
    }

    // 2. Backward compatibility with ?data= base64 payload
    if (dataParam) {
      try {
        const decoded = JSON.parse(
          atob(dataParam.replace(/-/g, "+").replace(/_/g, "/"))
        );
        login(decoded);
        loadCartCount().catch(() => {});
        if (decoded.isAdmin || decoded.role === "admin" || decoded.role === "owner") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/login?error=google_failed", { replace: true });
      }
      return;
    }

    // No token or data provided
    navigate("/login?error=google_failed", { replace: true });
  }, []); // eslint-disable-line

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        fontSize: 16,
        color: "#4B5563",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #E5E7EB",
          borderTopColor: "#2563EB",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <span style={{ fontWeight: 600 }}>
        {errorMsg || "Authenticating with Google OAuth 2.0…"}
      </span>
      <span style={{ fontSize: 13, color: "#9CA3AF" }}>
        Please wait while we secure your session.
      </span>
    </div>
  );
};

export default OAuthCallback;
