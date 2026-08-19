import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaShoppingBag } from "react-icons/fa";

import { register } from "../services/authservice";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";

import "../styles/register.css";
import "../styles/auth.css";

// ── KYC upload field component ────────────────────────────────
const KycUpload = ({ label, fieldKey, value, onChange, uploading, disabled }) => {
  const ref = useRef(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(fieldKey, data.image);
    } catch {
      onChange(fieldKey, "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kyc-field">
      <label className="kyc-label">{label} <span className="auth-required">*</span></label>
      <div
        className={`kyc-upload ${value ? "kyc-upload--done" : ""}`}
        onClick={() => !disabled && !busy && ref.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={label} className="kyc-preview" />
        ) : (
          <div className="kyc-placeholder">
            <span className="kyc-icon">📤</span>
            <span>{busy ? "Uploading…" : "Click to upload"}</span>
          </div>
        )}
        {value && !busy && <span className="kyc-check">✓</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={disabled || busy} />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
const Register = () => {
  const navigate             = useNavigate();
  const { login: loginUser } = useAuth();
  const { loadCartCount }    = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [kyc, setKyc] = useState({ idFront: "", idBack: "", selfie: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const isSeller = formData.role === "seller";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error)   setError("");
    if (success) setSuccess("");
  };

  const handleKyc = (field, value) => {
    setKyc((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!formData.fullName.trim())  return "Full name is required.";
    if (!formData.email.trim())     return "Email address is required.";
    if (!formData.phone.trim())     return "Phone number is required.";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match.";
    if (isSeller) {
      if (!kyc.idFront) return "Please upload your National ID (front).";
      if (!kyc.idBack)  return "Please upload your National ID (back).";
      if (!kyc.selfie)  return "Please upload your selfie photo.";
    }
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
        role:     formData.role,
      };

      if (isSeller) {
        payload.kycIdFront = kyc.idFront;
        payload.kycIdBack  = kyc.idBack;
        payload.kycSelfie  = kyc.selfie;
      }

      const data = await register(payload);
      loginUser(data);
      await loadCartCount();
      navigate("/", { replace: true, state: { registered: true } });
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
          <span>TechStore</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join TechStore and start shopping today</p>

        {success && <div className="auth-success" role="status">{success}</div>}
        {error   && <div className="auth-error"   role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-grid">

            {/* Full Name */}
            <div className="auth-field auth-field-full">
              <label htmlFor="fullName">Full name <span className="auth-required">*</span></label>
              <input id="fullName" type="text" name="fullName" value={formData.fullName}
                onChange={handleChange} placeholder="John Doe" autoComplete="name"
                autoFocus disabled={loading} />
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email address <span className="auth-required">*</span></label>
              <input id="email" type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="you@example.com" autoComplete="email"
                disabled={loading} />
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label htmlFor="phone">Phone number <span className="auth-required">*</span></label>
              <input id="phone" type="tel" name="phone" value={formData.phone}
                onChange={handleChange} placeholder="+251 9..." autoComplete="tel"
                disabled={loading} />
            </div>

            {/* Address */}
            <div className="auth-field auth-field-full">
              <label htmlFor="address">Address <span className="auth-optional">(optional)</span></label>
              <input id="address" type="text" name="address" value={formData.address}
                onChange={handleChange} placeholder="Addis Ababa, Bole..."
                autoComplete="street-address" disabled={loading} />
            </div>

            {/* Role dropdown — Customer or Seller only */}
            <div className="auth-field auth-field-full">
              <label htmlFor="role">Account type <span className="auth-required">*</span></label>
              <select id="role" name="role" value={formData.role}
                onChange={handleChange} className="auth-select" disabled={loading}>
                <option value="customer">Customer</option>
                <option value="seller">Seller</option>
              </select>
              {isSeller && (
                <p className="auth-hint">
                  Seller accounts require KYC verification before you can list products.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password <span className="auth-required">*</span></label>
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

          {/* ── Seller KYC section ── */}
          {isSeller && (
            <div className="kyc-section">
              <h3 className="kyc-heading">KYC Verification</h3>
              <p className="kyc-desc">
                Upload clear photos of your documents. Your account will be reviewed before you can list products.
              </p>
              <div className="kyc-grid">
                <KycUpload label="National ID – Front" fieldKey="idFront"
                  value={kyc.idFront} onChange={handleKyc} disabled={loading} />
                <KycUpload label="National ID – Back" fieldKey="idBack"
                  value={kyc.idBack}  onChange={handleKyc} disabled={loading} />
                <KycUpload label="Selfie Photo" fieldKey="selfie"
                  value={kyc.selfie}  onChange={handleKyc} disabled={loading} />
              </div>
            </div>
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
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-divider">or</div>
        <a
          href={`${import.meta.env.VITE_API_URL?.replace("/api","") || "https://e-commerce-techstore-2.onrender.com"}/api/auth/google`}
          className="google-btn" aria-label="Sign up with Google">
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
