import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEye, FaEyeSlash, FaShoppingBag } from "react-icons/fa";

import { register } from "../services/authservice";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import "../styles/register.css";
import "../styles/auth.css";

// ── Main component ────────────────────────────────────────────
const Register = () => {
  const { t }                = useTranslation();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [searchParams]       = useSearchParams();
  const { login: loginUser } = useAuth();
  const { loadCartCount }    = useCart();

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
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        fullName: formData.fullName,
        email:    formData.email,
        phone:    formData.phone,
        address:  formData.address,
        password: formData.password,
      };

      const data = await register(payload);
      loginUser(data);
      await loadCartCount();
      const redirectTo = location.state?.from || searchParams.get("from") || "/";
      navigate(redirectTo, { replace: true, state: { registered: true, pendingProductId: location.state?.pendingProductId } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        "Registration failed. Please check your details and try again."
      );
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
          <span>OICT_TechStore</span>
        </div>

        <h1 className="auth-title">{t("auth.createAccount")}</h1>
        <p className="auth-subtitle">{t("auth.joinUs")}</p>

        {success && <div className="auth-success" role="status">{success}</div>}
        {error   && <div className="auth-error"   role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-grid">

            {/* Full Name */}
            <div className="auth-field auth-field-full">
              <label htmlFor="fullName">{t("auth.fullName")} <span className="auth-required">*</span></label>
              <input id="fullName" type="text" name="fullName" value={formData.fullName}
                onChange={handleChange} placeholder="John Doe" autoComplete="name"
                autoFocus disabled={loading} />
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">{t("auth.email")} <span className="auth-required">*</span></label>
              <input id="email" type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="you@example.com" autoComplete="email"
                disabled={loading} />
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label htmlFor="phone">{t("auth.phone")} <span className="auth-required">*</span></label>
              <input id="phone" type="tel" name="phone" value={formData.phone}
                onChange={handleChange} placeholder="+251 9..." autoComplete="tel"
                disabled={loading} />
            </div>

            {/* Address */}
            <div className="auth-field auth-field-full">
              <label htmlFor="address">{t("auth.address")} <span className="auth-optional">(optional)</span></label>
              <input id="address" type="text" name="address" value={formData.address}
                onChange={handleChange} placeholder="Addis Ababa, Bole..."
                autoComplete="street-address" disabled={loading} />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">{t("auth.password")} <span className="auth-required">*</span></label>
              <div className="auth-input-wrap">
                <input id="password" type={showPassword ? "text" : "password"}
                  name="password" value={formData.password}
                  onChange={handleChange} placeholder="At least 6 characters"
                  autoComplete="new-password" disabled={loading} />
                <button type="button" className="auth-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password <span className="auth-required">*</span></label>
              <div className="auth-input-wrap">
                <input id="confirmPassword" type={showConfirm ? "text" : "password"}
                  name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="Repeat your password"
                  autoComplete="new-password" disabled={loading} />
                <button type="button" className="auth-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Password strength */}
          {formData.password.length > 0 && (
            <PasswordStrength password={formData.password} />
          )}

          <button type="submit"
            className={`auth-submit${loading ? " auth-submit--loading" : ""}`}
            disabled={loading}>
            {loading ? (
              <><span className="auth-spinner" /><span>Creating account...</span></>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-footer">
          {t("auth.alreadyHaveAccount")} <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (password.length < 6) return { label: "Too short", level: 0 };
    let score = 0;
    if (password.length >= 8)           score++;
    if (/[A-Z]/.test(password))         score++;
    if (/[0-9]/.test(password))         score++;
    if (/[^A-Za-z0-9]/.test(password))  score++;
    if (score <= 1) return { label: "Weak",   level: 1 };
    if (score === 2) return { label: "Fair",  level: 2 };
    if (score === 3) return { label: "Good",  level: 3 };
    return              { label: "Strong", level: 4 };
  };
  const { label, level } = getStrength();
  const colors = ["", "#dc2626", "#f59e0b", "#2563eb", "#16a34a"];
  const widths  = ["0%", "25%", "50%", "75%", "100%"];
  return (
    <div className="auth-strength">
      <div className="auth-strength-bar">
        <div className="auth-strength-fill"
          style={{ width: widths[level], background: colors[level] }} />
      </div>
      <span className="auth-strength-label" style={{ color: colors[level] }}>{label}</span>
    </div>
  );
};

export default Register;
