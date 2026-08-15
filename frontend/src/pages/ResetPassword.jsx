import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

const ResetPassword = () => {
  const [searchParams]             = useSearchParams();
  const navigate                   = useNavigate();
  const token                      = searchParams.get("token") || "";

  const [password,   setPassword]  = useState("");
  const [confirm,    setConfirm]   = useState("");
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [success,    setSuccess]   = useState(false);
  const [showPwd,    setShowPwd]   = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: "0 0 10px", color: "#111827" }}>Invalid Link</h2>
          <p style={{ color: "#6B7280", marginBottom: 24 }}>
            This reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="auth-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password)              { setError("Please enter a new password."); return; }
    if (password.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)   { setError("Passwords do not match."); return; }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🛒</span>
          <span className="auth-logo-text">OBSA_Tech<span>Store</span></span>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <h1 className="auth-title">Password Reset!</h1>
            <p className="auth-subtitle" style={{ lineHeight: 1.6, marginBottom: 24 }}>
              Your password has been reset successfully. Redirecting you to sign in…
            </p>
            <Link to="/login" className="auth-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">Choose a strong password for your account.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>New Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="At least 6 characters"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPwd((p) => !p)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Re-enter your password"
                />
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="auth-pwd-hint">
                  {password.length < 6
                    ? <span style={{ color: "#EF4444" }}>Too short (min 6 chars)</span>
                    : password.length < 10
                    ? <span style={{ color: "#F59E0B" }}>Moderate — consider longer</span>
                    : <span style={{ color: "#16A34A" }}>Strong password ✓</span>
                  }
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <div className="auth-switch">
              <Link to="/login">← Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
