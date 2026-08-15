import { useState } from "react";
import { Link }     from "react-router-dom";
import api          from "../services/api";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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

        {submitted ? (
          /* Success state */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📧</div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="auth-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
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

export default ForgotPassword;
