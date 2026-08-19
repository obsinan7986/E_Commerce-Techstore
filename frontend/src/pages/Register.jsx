import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaShoppingBag } from "react-icons/fa";

import { register } from "../services/authservice";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import "../styles/register.css";
import "../styles/auth.css";

const Register = () => {
  const navigate              = useNavigate();
  const { login: loginUser }  = useAuth();
  const { loadCartCount }     = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear messages when the user starts typing again
    if (error)   setError("");
    if (success) setSuccess("");
  };

  const validate = () => {
    if (!formData.fullName.trim())  return "Full name is required.";
    if (!formData.email.trim())     return "Email address is required.";
    if (!formData.phone.trim())     return "Phone number is required.";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Call POST /api/auth/register — returns user object + JWT token
      const data = await register({
        fullName: formData.fullName,
        email:    formData.email,
        phone:    formData.phone,
        address:  formData.address,
        password: formData.password,
      });

      // Automatically log the user in with the token returned by register
      loginUser(data);

      // Refresh cart count for the newly logged-in session
      await loadCartCount();

      // Redirect to home — requirement: after successful registration
      // go to home, not the login page
      navigate("/", { replace: true, state: { registered: true } });

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        "Registration failed. Please check your details and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">

        {/* Brand */}
        <div className="auth-brand">
          <FaShoppingBag className="auth-brand-icon" />
          <span>TechStore</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join TechStore and start shopping today</p>

        {/* Success banner */}
        {success && (
          <div className="auth-success" role="status">
            {success}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-grid">

            {/* Full Name */}
            <div className="auth-field auth-field-full">
              <label htmlFor="fullName">
                Full name <span className="auth-required">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">
                Email address <span className="auth-required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label htmlFor="phone">
                Phone number <span className="auth-required">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+251 9..."
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            {/* Address */}
            <div className="auth-field auth-field-full">
              <label htmlFor="address">
                Address{" "}
                <span className="auth-optional">(optional)</span>
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Addis Ababa, Bole..."
                autoComplete="street-address"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">
                Confirm password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

          </div>

          {/* Password strength indicator */}
          {formData.password.length > 0 && (
            <PasswordStrength password={formData.password} />
          )}

          <button
            type="submit"
            className={`auth-submit${loading ? " auth-submit--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>

        {/* ── Google Sign-Up ── */}
        <div className="auth-divider">or</div>
        <a
          href={`${import.meta.env.VITE_API_URL?.replace("/api","") || "https://e-commerce-techstore-2.onrender.com"}/api/auth/google`}
          className="google-btn"
          aria-label="Sign up with Google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </a>

      </div>
    </div>
  );
};

/* ── Password strength indicator ──────────────────────────── */
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (password.length < 6) return { label: "Too short", level: 0 };
    let score = 0;
    if (password.length >= 8)       score++;
    if (/[A-Z]/.test(password))     score++;
    if (/[0-9]/.test(password))     score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: "Weak",   level: 1 };
    if (score === 2) return { label: "Fair",  level: 2 };
    if (score === 3) return { label: "Good",  level: 3 };
    return                { label: "Strong", level: 4 };
  };

  const { label, level } = getStrength();
  const colors = ["", "#dc2626", "#f59e0b", "#2563eb", "#16a34a"];
  const widths  = ["0%", "25%", "50%", "75%", "100%"];

  return (
    <div className="auth-strength">
      <div className="auth-strength-bar">
        <div
          className="auth-strength-fill"
          style={{ width: widths[level], background: colors[level] }}
        />
      </div>
      <span className="auth-strength-label" style={{ color: colors[level] }}>
        {label}
      </span>
    </div>
  );
};

export default Register;
