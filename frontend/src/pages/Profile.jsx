import { toast } from "react-toastify";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiUser,
  FiShoppingBag,
  FiCreditCard,
  FiHeart,
  FiMessageSquare,
  FiBell,
  FiShoppingCart,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiLock,
  FiMapPin,
  FiArrowRight,
  FiExternalLink,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useNotifications } from "../context/NotificationContext";
import { getWishlist } from "../services/wishlistService";
import api, { BASE_URL } from "../services/api";
import "../styles/profile.css";

/* ── Address Book Component ───────────────────────────────── */
const EMPTY_ADDR = { label: "Home", fullName: "", phone: "", address: "", city: "", subCity: "" };

const AddressBook = () => {
  const confirm = useConfirm();
  const [addresses, setAddresses] = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_ADDR);
  const [saving,    setSaving]    = useState(false);
  const [addrErr,   setAddrErr]   = useState("");

  const load = () =>
    api.get("/auth/addresses")
      .then(r => setAddresses(r.data.addresses || []))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm(EMPTY_ADDR); setAddrErr(""); setShowForm(true); };
  const openEdit = (a) => {
    setEditId(a._id);
    setForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, subCity: a.subCity || "" });
    setAddrErr("");
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setAddrErr("Full name, phone, address and city are required.");
      return;
    }
    try {
      setSaving(true);
      setAddrErr("");
      if (editId) await api.put(`/auth/addresses/${editId}`, form);
      else        await api.post("/auth/addresses", form);
      closeForm();
      await load();
    } catch (err) {
      setAddrErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Address",
      message: "Are you sure you want to delete this address?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await api.delete(`/auth/addresses/${id}`).catch(() => {});
    await load();
  };

  const handleSetDefault = async (id) => {
    await api.patch(`/auth/addresses/${id}/default`).catch(() => {});
    await load();
  };

  return (
    <div className="profile-section-card" style={{ marginTop: 24 }}>
      <div className="addr-book-header">
        <div>
          <h3 className="section-title">Saved Delivery Addresses</h3>
          <p className="section-subtitle">Manage your shipping and billing addresses for fast checkout</p>
        </div>
        <button className="btn-secondary" onClick={openAdd} type="button" style={{ height: 38, padding: "0 16px" }}>
          + Add New Address
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <p className="addr-empty">No saved addresses yet.</p>
      )}

      <div className="addr-list">
        {addresses.map(a => (
          <div className={`addr-card ${a.isDefault ? "addr-card--default" : ""}`} key={a._id}>
            <div className="addr-card-body">
              <div className="addr-card-top">
                <span className="addr-label">{a.label}</span>
                {a.isDefault && <span className="addr-default-badge">Default</span>}
              </div>
              <p><strong>{a.fullName}</strong> · {a.phone}</p>
              <p>{a.address}, {a.city}{a.subCity ? `, ${a.subCity}` : ""}</p>
            </div>
            <div className="addr-card-actions">
              {!a.isDefault && (
                <button type="button" className="addr-btn addr-btn--default" onClick={() => handleSetDefault(a._id)}>
                  Set Default
                </button>
              )}
              <button type="button" className="addr-btn addr-btn--edit" onClick={() => openEdit(a)}>Edit</button>
              <button type="button" className="addr-btn addr-btn--delete" onClick={() => handleDelete(a._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="addr-form-wrap">
          <h4 style={{ margin: "0 0 14px", color: "#1E293B" }}>{editId ? "Edit Address" : "New Address"}</h4>
          {addrErr && <div className="profile-error">{addrErr}</div>}
          <form className="addr-form" onSubmit={handleSave}>
            <div className="addr-form-row">
              <div className="form-group">
                <label>Label</label>
                <input className="addr-input" value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Home / Work / Other" />
              </div>
            </div>
            <div className="addr-form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input className="addr-input" value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input className="addr-input" type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Street Address *</label>
              <input className="addr-input" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div className="addr-form-row">
              <div className="form-group">
                <label>City *</label>
                <input className="addr-input" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Sub-city / District</label>
                <input className="addr-input" value={form.subCity}
                  onChange={e => setForm(f => ({ ...f, subCity: e.target.value }))} />
              </div>
            </div>
            <div className="addr-form-actions">
              <button type="button" className="addr-btn addr-btn--cancel" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="addr-btn addr-btn--save" disabled={saving}>
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ── Main Customer Profile / Account Page ─────────────────── */
const Profile = () => {
  const { user, login: updateUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploadingAvatar(true);
      const res = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.avatar || res.data.profileImage;
      updateUser({ ...user, avatar: url, profileImage: url });
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile picture.");
    } finally {
      e.target.value = "";
      setUploadingAvatar(false);
    }
  };

  // Active tab: 'profile' | 'become-seller'
  const initialTab = searchParams.get("tab") === "become-seller" ? "become-seller" : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Wishlist item count
  const [wishlistCount, setWishlistCount] = useState(0);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "become-seller") {
      setActiveTab("become-seller");
    } else if (tabParam === "profile") {
      setActiveTab("profile");
    }
  }, [searchParams]);

  // Load wishlist count
  useEffect(() => {
    if (user) {
      getWishlist()
        .then((data) => setWishlistCount(data.products?.length || 0))
        .catch(() => {});
    }
  }, [user]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "profile" ? {} : { tab });
  };

  // ── Tab 1: Profile & Security State ───────────────────────
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError,   setProfileError]   = useState("");

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityError,   setSecurityError]   = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        phone:    user.phone    || "",
        address:  user.address  || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) { setProfileError("Full name is required."); return; }
    if (!profileForm.phone.trim())    { setProfileError("Phone number is required."); return; }
    try {
      setProfileLoading(true); setProfileError(""); setProfileSuccess("");
      const { data } = await api.put("/auth/profile", profileForm);
      updateUser({ ...user, ...data });
      setProfileSuccess("Personal profile updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(""); setSecuritySuccess("");
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }
    if (securityForm.newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters.");
      return;
    }
    try {
      setSecurityLoading(true);
      await api.put("/auth/profile", {
        currentPassword: securityForm.currentPassword,
        newPassword:     securityForm.newPassword,
      });
      setSecuritySuccess("Password updated successfully.");
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setSecurityError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSecurityLoading(false);
    }
  };

  // ── Tab 2: "Become a Seller" KYC State ────────────────────
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const [storeName,        setStoreName]        = useState(user?.storeName || "");
  const [nationalIdNumber, setNationalIdNumber] = useState(user?.nationalIdNumber || "");
  const [frontFile,        setFrontFile]        = useState(null);
  const [frontPreview,     setFrontPreview]     = useState("");
  const [backFile,         setBackFile]         = useState(null);
  const [backPreview,      setBackPreview]      = useState("");
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerError,      setSellerError]      = useState("");
  const [sellerSuccess,    setSellerSuccess]    = useState("");

  // Sync state if user changes
  useEffect(() => {
    if (user?.storeName) setStoreName(user.storeName);
    if (user?.nationalIdNumber) setNationalIdNumber(user.nationalIdNumber);
  }, [user]);

  const handleFrontChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setSellerError("");

    if (file.type.startsWith("image/")) {
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setFrontPreview(file.name);
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    setSellerError("");

    if (file.type.startsWith("image/")) {
      setBackPreview(URL.createObjectURL(file));
    } else {
      setBackPreview(file.name);
    }
  };

  const handleSellerSubmit = async (e) => {
    e.preventDefault();
    setSellerError("");
    setSellerSuccess("");

    if (!storeName.trim()) {
      setSellerError("Business / Store Name is required.");
      return;
    }
    if (!nationalIdNumber.trim()) {
      setSellerError("National ID / Trade License Number is required.");
      return;
    }
    const hasFront = frontFile || user?.idFrontImage || user?.kycDocs?.idFront || user?.idDocumentImage;
    if (!hasFront) {
      setSellerError("Please upload National ID / Passport (Front).");
      return;
    }

    try {
      setSellerSubmitting(true);
      const fd = new FormData();
      fd.append("storeName", storeName.trim());
      fd.append("nationalIdNumber", nationalIdNumber.trim());
      if (frontFile) {
        fd.append("idFront", frontFile);
        fd.append("idDocumentImage", frontFile); // backwards compat
      }
      if (backFile) {
        fd.append("idBack", backFile);
      }

      const { data } = await api.post("/seller/kyc", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local auth context
      if (data.user) {
        updateUser({ ...user, ...data.user, kycStatus: "pending" });
      } else {
        updateUser({
          ...user,
          storeName: storeName.trim(),
          nationalIdNumber: nationalIdNumber.trim(),
          kycStatus: "pending",
        });
      }

      setSellerSuccess("Your seller application has been submitted successfully and is now under review by the platform owner.");
    } catch (err) {
      setSellerError(err.response?.data?.message || "Failed to submit seller application.");
    } finally {
      setSellerSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", color: "#64748B" }}>
        Loading account profile…
      </div>
    );
  }

  const isApprovedSeller = user.role === "seller" || user.kycStatus === "verified" || user.kycStatus === "approved";
  const isPendingKYC     = user.kycStatus === "pending";
  const isRejectedKYC    = user.kycStatus === "rejected";

  const userInitial = user.fullName?.trim()?.charAt(0)?.toUpperCase() || "U";
  const roleDisplay = user.role === "owner"
    ? "CEO / Owner"
    : user.role === "admin"
    ? "Admin"
    : user.role === "seller"
    ? "Seller"
    : user.role === "finance"
    ? "Finance"
    : "Customer";

  return (
    <div className="customer-account-page">
      <div className="customer-account-container">

        {/* ══════════════════════════════════════════════════════════
            COLUMN 1: Left Profile Sidebar Card
           ══════════════════════════════════════════════════════════ */}
        <aside className="cust-sidebar-card">

          {/* 1. Top Header Card (Royal Blue Background) */}
          <div className="cust-sidebar-header">
            {/* Centered circular avatar (64px) with pink/rose background (#E11D48) */}
            <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 12px" }}>
              <div className="cust-avatar-circle" style={{ width: "100%", height: "100%", overflow: "hidden", margin: 0 }}>
                {(user.avatar || user.profileImage) ? (
                  <img
                    src={user.avatar || user.profileImage}
                    alt={user.fullName || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  userInitial
                )}
              </div>
              <label
                htmlFor="profile-avatar-upload"
                className="cust-avatar-camera-btn"
                title="Upload Profile Picture"
              >
                {uploadingAvatar ? "⏳" : "📷"}
              </label>
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </div>

            {/* Bold white user name */}
            <h2 className="cust-user-name">{user.fullName || "Obsa"}</h2>

            {/* Light-blue email */}
            <p className="cust-user-email">{user.email}</p>

            {/* Semi-transparent rounded pill badge showing role */}
            <span className="cust-role-badge">
              {roleDisplay}
            </span>
          </div>

          {/* 2. Navigation Menu (White card body below the blue header) */}
          <nav className="cust-sidebar-menu">
            {/* 1. My Profile */}
            <button
              type="button"
              className={`cust-menu-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => switchTab("profile")}
            >
              <span className="cust-menu-icon"><FiUser size={19} /></span>
              <span className="cust-menu-label">My Profile</span>
            </button>

            {/* 2. My Orders */}
            <button
              type="button"
              className="cust-menu-item"
              onClick={() => navigate("/orders")}
            >
              <span className="cust-menu-icon"><FiShoppingBag size={19} /></span>
              <span className="cust-menu-label">My Orders</span>
            </button>

            {/* 3. Payment History */}
            <button
              type="button"
              className="cust-menu-item"
              onClick={() => navigate("/payment-history")}
            >
              <span className="cust-menu-icon"><FiCreditCard size={19} /></span>
              <span className="cust-menu-label">Payment History</span>
            </button>

            {/* 4. Wishlist (Heart icon + red circular count badge when count > 0) */}
            <button
              type="button"
              className="cust-menu-item"
              onClick={() => navigate("/wishlist")}
            >
              <span className="cust-menu-icon"><FiHeart size={19} /></span>
              <span className="cust-menu-label">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="cust-menu-badge">{wishlistCount}</span>
              )}
            </button>

            {/* 5. Message Center */}
            <button
              type="button"
              className="cust-menu-item"
              onClick={() => navigate("/messages")}
            >
              <span className="cust-menu-icon"><FiMessageSquare size={19} /></span>
              <span className="cust-menu-label">Message Center</span>
            </button>

            {/* 6. Notifications (Bell icon + red circular unread count badge when count > 0) */}
            <button
              type="button"
              className="cust-menu-item"
              onClick={() => navigate("/notifications")}
            >
              <span className="cust-menu-icon"><FiBell size={19} /></span>
              <span className="cust-menu-label">Notifications</span>
              {unreadCount > 0 && (
                <span className="cust-menu-badge">{unreadCount}</span>
              )}
            </button>

            {/* 7. Become a Seller / Go to Seller Dashboard */}
            {isApprovedSeller ? (
              <button
                type="button"
                className="cust-menu-item cust-menu-item--seller-approved"
                onClick={() => navigate("/seller/dashboard")}
              >
                <span className="cust-menu-icon"><FiShoppingCart size={19} /></span>
                <span className="cust-menu-label">Go to Seller Dashboard</span>
                <FiExternalLink size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />
              </button>
            ) : (
              <button
                type="button"
                className={`cust-menu-item cust-menu-item--become-seller ${activeTab === "become-seller" ? "active" : ""}`}
                onClick={() => switchTab("become-seller")}
              >
                <span className="cust-menu-icon"><FiShoppingCart size={19} /></span>
                <span className="cust-menu-label">Become a Seller</span>
              </button>
            )}
          </nav>
        </aside>

        {/* ══════════════════════════════════════════════════════════
            COLUMN 2: Right Content Workspace
           ══════════════════════════════════════════════════════════ */}
        <main className="cust-workspace">

          {/* ──────────────────────────────────────────────────────
              TAB A: "Become a Seller" Content
             ────────────────────────────────────────────────────── */}
          {activeTab === "become-seller" && (
            <div className="become-seller-view">

              {/* 1. Header Section (Centered) */}
              <div className="become-seller-header">
                <h1 className="become-seller-title">Become a Seller</h1>
                <p className="become-seller-subtitle">
                  Join our marketplace and sell your products to thousands of tech enthusiasts
                </p>
              </div>

              {/* 2. 2x2 Benefits Grid (4 White Rounded Cards with subtle border #E5E7EB) */}
              <div className="seller-benefits-grid">
                {/* Card 1 */}
                <div className="benefit-card">
                  <div className="benefit-icon">🏪</div>
                  <div className="benefit-body">
                    <h4 className="benefit-title">Your Own Storefront</h4>
                    <p className="benefit-desc">List your products and reach thousands of buyers</p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="benefit-card">
                  <div className="benefit-icon">💰</div>
                  <div className="benefit-body">
                    <h4 className="benefit-title">Earn Revenue</h4>
                    <p className="benefit-desc">Set your own prices and grow your business</p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="benefit-card">
                  <div className="benefit-icon">📦</div>
                  <div className="benefit-body">
                    <h4 className="benefit-title">Easy Management</h4>
                    <p className="benefit-desc">Manage inventory and orders from one dashboard</p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="benefit-card">
                  <div className="benefit-icon">🔒</div>
                  <div className="benefit-body">
                    <h4 className="benefit-title">Secure Payments</h4>
                    <p className="benefit-desc">Get paid securely through Chapa integration</p>
                  </div>
                </div>
              </div>

              {/* Status Banners */}
              {isPendingKYC && (
                <div className="kyc-status-banner kyc-status-banner--pending">
                  <FiClock className="kyc-banner-icon" />
                  <div>
                    <h4 className="kyc-banner-title">Your Seller Application is Under Review by the Owner</h4>
                    <p className="kyc-banner-text">
                      We have received your KYC documents and business information. The marketplace owner will review your application and agree on the platform commission rate. You will receive access to your Seller Dashboard upon approval.
                    </p>
                  </div>
                </div>
              )}

              {isRejectedKYC && (
                <div className="kyc-status-banner kyc-status-banner--rejected">
                  <FiAlertCircle className="kyc-banner-icon" />
                  <div>
                    <h4 className="kyc-banner-title">Application Status: Rejected</h4>
                    <p className="kyc-banner-text">
                      <strong>Reason:</strong> {user.kycRejectionReason || "Identity document was unclear or details did not match. Please verify and re-submit below."}
                    </p>
                  </div>
                </div>
              )}

              {isApprovedSeller && (
                <div className="kyc-status-banner kyc-status-banner--approved">
                  <FiCheckCircle className="kyc-banner-icon" />
                  <div>
                    <h4 className="kyc-banner-title">You are an Approved Seller!</h4>
                    <p className="kyc-banner-text">
                      Congratulations! Your seller account is active and verified. You can start listing products and monitoring sales in your seller portal.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => navigate("/seller/dashboard")}
                      style={{ marginTop: 10 }}
                    >
                      Open Seller Dashboard <FiArrowRight style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. "Apply to Become a Seller" Form Card */}
              <div className="seller-form-card">
                <h3 className="form-card-heading">Apply to Become a Seller</h3>

                {sellerSuccess && (
                  <div className="profile-success" style={{ marginBottom: 18 }}>
                    <FiCheckCircle /> {sellerSuccess}
                  </div>
                )}
                {sellerError && (
                  <div className="profile-error" style={{ marginBottom: 18 }}>
                    <FiAlertCircle /> {sellerError}
                  </div>
                )}

                <form onSubmit={handleSellerSubmit} className="become-seller-form">
                  {/* Field 1: Business / Store Name */}
                  <div className="form-group">
                    <label htmlFor="storeName">
                      Business / Store Name <span className="auth-required">*</span>
                    </label>
                    <input
                      id="storeName"
                      type="text"
                      className="form-control"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Abebe Tech Store"
                      required
                      disabled={isPendingKYC || sellerSubmitting}
                    />
                  </div>

                  {/* Field 2: National ID / Trade License Number */}
                  <div className="form-group">
                    <label htmlFor="nationalIdNumber">
                      National ID / Trade License Number <span className="auth-required">*</span>
                    </label>
                    <input
                      id="nationalIdNumber"
                      type="text"
                      className="form-control"
                      value={nationalIdNumber}
                      onChange={(e) => setNationalIdNumber(e.target.value)}
                      placeholder="Your national ID or business license number"
                      required
                      disabled={isPendingKYC || sellerSubmitting}
                    />
                  </div>

                  {/* Field 3: 2-Column Side-by-Side ID Front & Back Upload Grid */}
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: 8 }}>
                      National ID / Identity Documents <span className="auth-required">*</span>
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {/* Slot 1: Front */}
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          National ID / Passport (Front) <span className="auth-required">*</span>
                        </div>
                        <div
                          className={`file-upload-box ${(frontFile || user.idFrontImage || user.kycDocs?.idFront || user.idDocumentImage) ? "has-file" : ""}`}
                          onClick={() => !isPendingKYC && !sellerSubmitting && frontInputRef.current?.click()}
                          style={{ minHeight: 120, padding: 12, cursor: isPendingKYC || sellerSubmitting ? "not-allowed" : "pointer" }}
                        >
                          <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: "none" }}
                            onChange={handleFrontChange}
                            disabled={isPendingKYC || sellerSubmitting}
                          />
                          {frontPreview && frontFile?.type.startsWith("image/") ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              <img src={frontPreview} alt="Front Preview" style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 6 }} />
                              <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600 }}>Change Front Photo</span>
                            </div>
                          ) : frontFile ? (
                            <div className="file-preview-info">
                              <span className="file-name">Selected: {frontFile.name}</span>
                              <span className="file-subtext">Click to change</span>
                            </div>
                          ) : (user.idFrontImage || user.kycDocs?.idFront || user.idDocumentImage) ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              <img
                                src={
                                  (user.idFrontImage || user.kycDocs?.idFront || user.idDocumentImage)?.startsWith("http")
                                    ? (user.idFrontImage || user.kycDocs?.idFront || user.idDocumentImage)
                                    : `${BASE_URL}${user.idFrontImage || user.kycDocs?.idFront || user.idDocumentImage}`
                                }
                                alt="Front Document"
                                style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 6 }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              <span className="file-name" style={{ fontSize: "0.78rem" }}>Front ID Uploaded</span>
                              <span className="file-subtext" style={{ fontSize: "0.72rem" }}>Click to replace</span>
                            </div>
                          ) : (
                            <div className="file-preview-info" style={{ textAlign: "center" }}>
                              <FiUploadCloud size={28} className="file-upload-icon" />
                              <span className="file-maintext" style={{ fontSize: "0.82rem", display: "block" }}>Upload Front Side *</span>
                              <span className="file-subtext" style={{ fontSize: "0.72rem" }}>PNG, JPG up to 10MB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slot 2: Back */}
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          National ID / Passport (Back) <span className="auth-required">*</span>
                        </div>
                        <div
                          className={`file-upload-box ${(backFile || user.idBackImage || user.kycDocs?.idBack) ? "has-file" : ""}`}
                          onClick={() => !isPendingKYC && !sellerSubmitting && backInputRef.current?.click()}
                          style={{ minHeight: 120, padding: 12, cursor: isPendingKYC || sellerSubmitting ? "not-allowed" : "pointer" }}
                        >
                          <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: "none" }}
                            onChange={handleBackChange}
                            disabled={isPendingKYC || sellerSubmitting}
                          />
                          {backPreview && backFile?.type.startsWith("image/") ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              <img src={backPreview} alt="Back Preview" style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 6 }} />
                              <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 600 }}>Change Back Photo</span>
                            </div>
                          ) : backFile ? (
                            <div className="file-preview-info">
                              <span className="file-name">Selected: {backFile.name}</span>
                              <span className="file-subtext">Click to change</span>
                            </div>
                          ) : (user.idBackImage || user.kycDocs?.idBack) ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              <img
                                src={
                                  (user.idBackImage || user.kycDocs?.idBack)?.startsWith("http")
                                    ? (user.idBackImage || user.kycDocs?.idBack)
                                    : `${BASE_URL}${user.idBackImage || user.kycDocs?.idBack}`
                                }
                                alt="Back Document"
                                style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 6 }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              <span className="file-name" style={{ fontSize: "0.78rem" }}>Back ID Uploaded</span>
                              <span className="file-subtext" style={{ fontSize: "0.72rem" }}>Click to replace</span>
                            </div>
                          ) : (
                            <div className="file-preview-info" style={{ textAlign: "center" }}>
                              <FiUploadCloud size={28} className="file-upload-icon" />
                              <span className="file-maintext" style={{ fontSize: "0.82rem", display: "block" }}>Upload Back Side *</span>
                              <span className="file-subtext" style={{ fontSize: "0.72rem" }}>PNG, JPG up to 10MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <small className="field-caption" style={{ display: "block", marginTop: 8 }}>
                      Upload clear photos of both Front and Back of your national ID, passport, or trade license.
                    </small>
                  </div>

                  {/* Submit Button: Full-width Emerald Green */}
                  <button
                    type="submit"
                    className="btn-emerald-submit"
                    disabled={isPendingKYC || sellerSubmitting}
                  >
                    {sellerSubmitting ? (
                      <>
                        <span className="btn-spinner" /> Submitting Application...
                      </>
                    ) : isPendingKYC ? (
                      "Application Submitted (Under Review)"
                    ) : isRejectedKYC ? (
                      "Re-Submit Application"
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────
              TAB B: "My Profile" Content (Edit Info & Address Book)
             ────────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="my-profile-view">

              {/* Personal Information Card */}
              <div className="profile-section-card">
                <div className="section-header">
                  <h3 className="section-title">Personal Profile</h3>
                  <p className="section-subtitle">Update your personal details and primary contact information</p>
                </div>

                {profileSuccess && (
                  <div className="profile-success"><FiCheckCircle /> {profileSuccess}</div>
                )}
                {profileError && (
                  <div className="profile-error"><FiAlertCircle /> {profileError}</div>
                )}

                <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        className="form-control"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        placeholder="Your full name"
                        required
                        disabled={profileLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        className="form-control input-readonly"
                        value={user.email}
                        readOnly
                      />
                      <small style={{ color: "#94A3B8" }}>Email address cannot be changed.</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        id="phone"
                        type="tel"
                        className="form-control"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+251 9..."
                        required
                        disabled={profileLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="address">Primary Address</label>
                      <input
                        id="address"
                        type="text"
                        className="form-control"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Addis Ababa, Bole..."
                        disabled={profileLoading}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button type="submit" className="btn-primary" disabled={profileLoading}>
                      {profileLoading ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="profile-section-card" style={{ marginTop: 24 }}>
                <div className="section-header">
                  <h3 className="section-title">Password & Security</h3>
                  <p className="section-subtitle">Ensure your account is using a strong, unique password</p>
                </div>

                {securitySuccess && (
                  <div className="profile-success"><FiCheckCircle /> {securitySuccess}</div>
                )}
                {securityError && (
                  <div className="profile-error"><FiAlertCircle /> {securityError}</div>
                )}

                <form onSubmit={handleSecuritySubmit} className="profile-edit-form">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                        disabled={securityLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={securityForm.newPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                        placeholder="At least 6 characters"
                        required
                        disabled={securityLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={securityForm.confirmPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                        placeholder="Repeat new password"
                        required
                        disabled={securityLoading}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button type="submit" className="btn-secondary" disabled={securityLoading}>
                      {securityLoading ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Address Book Card */}
              <AddressBook />

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Profile;
