import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiMapPin,
  FiDollarSign,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/accountSettings.css";

const EMPTY_ADDR = { label: "Home", fullName: "", phone: "", address: "", city: "", subCity: "" };

const AccountSettingsPage = () => {
  const { user, login: updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  // ── Tab 1: Profile State ─────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      const { data } = await api.put("/auth/profile", profileForm);
      updateUser({ ...user, ...data });
      setSuccessMsg("Profile information updated successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab 2: Password & Security State ─────────────────────────
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (securityForm.newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      await api.put("/auth/profile", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSuccessMsg("Password updated successfully.");
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab 3: Saved Addresses State ─────────────────────────────
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId, setEditAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrLoading, setAddrLoading] = useState(false);

  const loadAddresses = async () => {
    try {
      const { data } = await api.get("/auth/addresses");
      setAddresses(data.addresses || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (activeTab === "addresses") {
      loadAddresses();
    }
  }, [activeTab]);

  const openAddAddress = () => {
    setEditAddrId(null);
    setAddrForm(EMPTY_ADDR);
    setShowAddrForm(true);
    clearMessages();
  };

  const openEditAddress = (a) => {
    setEditAddrId(a._id);
    setAddrForm({
      label: a.label || "Home",
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      city: a.city,
      subCity: a.subCity || "",
    });
    setShowAddrForm(true);
    clearMessages();
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setAddrLoading(true);
      if (editAddrId) {
        await api.put(`/auth/addresses/${editAddrId}`, addrForm);
        setSuccessMsg("Address updated successfully.");
      } else {
        await api.post("/auth/addresses", addrForm);
        setSuccessMsg("New address added successfully.");
      }
      setShowAddrForm(false);
      await loadAddresses();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save address.");
    } finally {
      setAddrLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/auth/addresses/${id}`);
      await loadAddresses();
      setSuccessMsg("Address removed.");
    } catch {
      setErrorMsg("Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.patch(`/auth/addresses/${id}/default`);
      await loadAddresses();
      setSuccessMsg("Default address updated.");
    } catch {
      setErrorMsg("Failed to set default address.");
    }
  };

  // ── Tab 4: Seller Commission & Payout State ──────────────────
  const [sellerKycData, setSellerKycData] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    telebirrPhone: "",
  });

  const loadSellerData = async () => {
    try {
      const { data } = await api.get("/seller/kyc");
      if (data.kyc) {
        setSellerKycData(data.kyc);
        if (data.kyc.payoutAccount) {
          setPayoutForm({
            bankName: data.kyc.payoutAccount.bankName || "",
            accountHolder: data.kyc.payoutAccount.accountHolder || "",
            accountNumber: data.kyc.payoutAccount.accountNumber || "",
            telebirrPhone: data.kyc.payoutAccount.telebirrPhone || "",
          });
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (activeTab === "seller-payout" && (user?.role === "seller" || user?.role === "owner")) {
      loadSellerData();
    }
  }, [activeTab, user]);

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      await api.put("/seller/payout-account", payoutForm);
      setSuccessMsg("Payout account details updated successfully.");
      await loadSellerData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update payout settings.");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab 5: Owner/Admin Global Commission & Gateway Rules ──────
  const [globalSettings, setGlobalSettings] = useState(null);
  const [globalForm, setGlobalForm] = useState({
    defaultCommissionType: "percentage",
    defaultCommissionRate: 10,
    instructions: "",
  });

  const loadGlobalSettings = async () => {
    try {
      const { data } = await api.get("/payments/settings");
      if (data.settings) {
        setGlobalSettings(data.settings);
        setGlobalForm({
          defaultCommissionType: data.settings.defaultCommissionType || "percentage",
          defaultCommissionRate: data.settings.defaultCommissionRate ?? 10,
          instructions: data.settings.instructions || "",
        });
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (activeTab === "global-commission" && (user?.role === "owner" || user?.role === "admin")) {
      loadGlobalSettings();
    }
  }, [activeTab, user]);

  const handleGlobalSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      await api.put("/payments/settings", globalForm);
      setSuccessMsg("Global commission and payment policies saved.");
      await loadGlobalSettings();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save global settings.");
    } finally {
      setLoading(false);
    }
  };

  // ── Tab: Recent Customer Orders ─────────────────────────────
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data } = await api.get("/orders/my-orders");
      setRecentOrders(data.orders || []);
    } catch {
      /* ignore */
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      loadRecentOrders();
    }
  }, [activeTab]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div className="acc-page">
      {/* ── Modern Gradient Profile Hero Banner ── */}
      <div className="acc-hero-banner">
        <div className="acc-hero-left">
          <div className="acc-hero-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="acc-hero-details">
            <h1>{user?.fullName || "User Account"}</h1>
            <div className="acc-hero-sub">
              <span>{user?.email}</span>
              {user?.phone && <span>· {user?.phone}</span>}
              <span className={`acc-hero-role-pill acc-role--${user?.role || "customer"}`}>
                {user?.role === "owner"
                  ? "CEO / Owner"
                  : user?.role === "admin"
                  ? "Administrator"
                  : user?.role === "finance"
                  ? "Finance Officer"
                  : user?.role === "seller"
                  ? "Verified Seller"
                  : "Customer"}
              </span>
              {user?.role === "seller" && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: user?.kycStatus === "verified" ? "#DCFCE7" : "#FEF3C7",
                    color: user?.kycStatus === "verified" ? "#166534" : "#92400E",
                  }}
                >
                  KYC: {user?.kycStatus || "pending"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="acc-alert-success">
          <FiCheckCircle style={{ marginRight: 8, verticalAlign: "middle" }} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="acc-alert-error">
          <FiAlertCircle style={{ marginRight: 8, verticalAlign: "middle" }} />
          {errorMsg}
        </div>
      )}

      {/* Modern Tabs */}
      <div className="acc-tabs">
        <button
          className={`acc-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => handleTabChange("profile")}
          type="button"
        >
          <FiUser className="acc-tab-icon" />
          <span>Profile Info</span>
        </button>

        <button
          className={`acc-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => handleTabChange("orders")}
          type="button"
        >
          <FiShoppingBag className="acc-tab-icon" />
          <span>Recent Orders</span>
        </button>

        <button
          className={`acc-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => handleTabChange("security")}
          type="button"
        >
          <FiLock className="acc-tab-icon" />
          <span>Password & Security</span>
        </button>

        <button
          className={`acc-tab-btn ${activeTab === "addresses" ? "active" : ""}`}
          onClick={() => handleTabChange("addresses")}
          type="button"
        >
          <FiMapPin className="acc-tab-icon" />
          <span>Saved Addresses</span>
        </button>

        {(user?.role === "seller" || user?.role === "owner") && (
          <button
            className={`acc-tab-btn ${activeTab === "seller-payout" ? "active" : ""}`}
            onClick={() => handleTabChange("seller-payout")}
            type="button"
          >
            <FiDollarSign className="acc-tab-icon" />
            <span>CEO Commission & Payout</span>
          </button>
        )}

        {(user?.role === "owner" || user?.role === "admin") && (
          <button
            className={`acc-tab-btn ${activeTab === "global-commission" ? "active" : ""}`}
            onClick={() => handleTabChange("global-commission")}
            type="button"
          >
            <FiSettings className="acc-tab-icon" />
            <span>Global Commission & Rules</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: PROFILE INFO ── */}
      {activeTab === "profile" && (
        <div className="acc-card">
          <h2 className="acc-card-title">Personal Profile</h2>
          <p className="acc-card-subtitle">Keep your contact details up to date</p>

          <form className="acc-form" onSubmit={handleProfileSubmit}>
            <div className="acc-form-grid">
              <div className="acc-field-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="acc-input"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="acc-field-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="acc-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+251 9..."
                  required
                />
              </div>
            </div>

            <div className="acc-field-group">
              <label>Email Address</label>
              <input type="email" className="acc-input" value={user?.email || ""} disabled />
              <small>Your account email is locked for security.</small>
            </div>

            <div className="acc-field-group">
              <label>Primary Street Address</label>
              <input
                type="text"
                className="acc-input"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="House, street, or office location"
              />
            </div>

            <button type="submit" className="acc-btn-primary" disabled={loading}>
              {loading ? "Saving Changes..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB: RECENT ORDERS ── */}
      {activeTab === "orders" && (
        <div className="acc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 className="acc-card-title">Recent Order Status</h2>
              <p className="acc-card-subtitle" style={{ margin: 0 }}>
                Track active deliveries, fulfillment states and payment receipts
              </p>
            </div>
            <Link to="/orders" className="acc-btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span>All Orders</span>
              <FiArrowRight />
            </Link>
          </div>

          {ordersLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading your orders…</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>
              <FiShoppingBag size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 16px" }}>You have not placed any orders yet.</p>
              <Link to="/products" className="acc-btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F1F5F9", textAlign: "left", color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 12px" }}>Order ID</th>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Total</th>
                    <th style={{ padding: "10px 12px" }}>Payment</th>
                    <th style={{ padding: "10px 12px" }}>Fulfillment</th>
                    <th style={{ padding: "10px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((ord) => (
                    <tr key={ord._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#2563EB" }}>
                        #{ord._id.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ padding: "12px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700 }}>
                        ETB {Number(ord.totalPrice).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: ord.paymentStatus === "Paid" ? "#DCFCE7" : "#FEF3C7",
                          color: ord.paymentStatus === "Paid" ? "#166534" : "#92400E",
                        }}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: ord.orderStatus === "Delivered" ? "#DCFCE7" : "#EFF6FF",
                          color: ord.orderStatus === "Delivered" ? "#166534" : "#1D4ED8",
                        }}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Link to={`/orders/${ord._id}`} style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PASSWORD & SECURITY ── */}
      {activeTab === "security" && (
        <div className="acc-card">
          <h2 className="acc-card-title">Password & Authentication</h2>
          <p className="acc-card-subtitle">Ensure your account is protected with a strong password</p>

          <form className="acc-form" onSubmit={handleSecuritySubmit}>
            <div className="acc-field-group">
              <label>Current Password</label>
              <input
                type="password"
                className="acc-input"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="acc-form-grid">
              <div className="acc-field-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="acc-input"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="acc-field-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="acc-input"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="acc-btn-primary" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: SAVED ADDRESSES ── */}
      {activeTab === "addresses" && (
        <div className="acc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 className="acc-card-title">Address Book</h2>
              <p className="acc-card-subtitle" style={{ margin: 0 }}>
                Manage delivery addresses for fast 1-click checkout
              </p>
            </div>
            {!showAddrForm && (
              <button
                type="button"
                className="acc-btn-primary"
                onClick={openAddAddress}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <FiPlus /> Add Address
              </button>
            )}
          </div>

          {/* Address Add / Edit Form Modal/Section */}
          {showAddrForm && (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: 10,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#0F172A" }}>
                {editAddrId ? "Edit Address" : "Add New Address"}
              </h3>
              <form className="acc-form" onSubmit={handleSaveAddress}>
                <div className="acc-form-grid">
                  <div className="acc-field-group">
                    <label>Label</label>
                    <input
                      type="text"
                      className="acc-input"
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      placeholder="Home / Work / Other"
                    />
                  </div>
                  <div className="acc-field-group">
                    <label>Recipient Full Name *</label>
                    <input
                      type="text"
                      className="acc-input"
                      value={addrForm.fullName}
                      onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="acc-form-grid">
                  <div className="acc-field-group">
                    <label>Contact Phone *</label>
                    <input
                      type="tel"
                      className="acc-input"
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="acc-field-group">
                    <label>City *</label>
                    <input
                      type="text"
                      className="acc-input"
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      placeholder="e.g. Addis Ababa"
                      required
                    />
                  </div>
                </div>

                <div className="acc-form-grid">
                  <div className="acc-field-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      className="acc-input"
                      value={addrForm.address}
                      onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                      placeholder="e.g. Bole Road, House 123"
                      required
                    />
                  </div>
                  <div className="acc-field-group">
                    <label>Sub-City / District</label>
                    <input
                      type="text"
                      className="acc-input"
                      value={addrForm.subCity}
                      onChange={(e) => setAddrForm({ ...addrForm, subCity: e.target.value })}
                      placeholder="e.g. Bole / Kirkos"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button type="submit" className="acc-btn-primary" disabled={addrLoading}>
                    {addrLoading ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    className="acc-input"
                    style={{ background: "#FFFFFF", cursor: "pointer", width: "auto" }}
                    onClick={() => setShowAddrForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of addresses */}
          {addresses.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: 14 }}>No saved addresses yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {addresses.map((a) => (
                <div
                  key={a._id}
                  style={{
                    padding: 16,
                    border: `1.5px solid ${a.isDefault ? "#2563EB" : "#E2E8F0"}`,
                    background: a.isDefault ? "#F8FAFF" : "#FFFFFF",
                    borderRadius: 10,
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 14, color: "#1E293B" }}>{a.label || "Home"}</strong>
                    {a.isDefault && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#2563EB",
                          background: "#EFF6FF",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#334155" }}>
                    <strong>{a.fullName}</strong> · {a.phone}
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748B" }}>
                    {a.address}, {a.city} {a.subCity ? `(${a.subCity})` : ""}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!a.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(a._id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: 12,
                          background: "#F1F5F9",
                          border: "1px solid #CBD5E1",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditAddress(a)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(a._id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: SELLER CEO COMMISSION & PAYOUT SETTINGS ── */}
      {(user?.role === "seller" || user?.role === "owner") && activeTab === "seller-payout" && (
        <div className="acc-card">
          <h2 className="acc-card-title">CEO Commission Agreement & Payout Settings</h2>
          <p className="acc-card-subtitle">
            Financial agreement set with CEO / Owner and disbursement accounts
          </p>

          {/* Active Commission Agreement Banner */}
          <div className="acc-agreement-banner">
            <div>
              <span className="acc-agreement-badge">Official Agreement</span>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#1E3A8A" }}>
                CEO Platform Commission Rate
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#3B82F6" }}>
                Debited automatically per product sale upon buyer payment confirmation
              </p>
            </div>
            <div>
              <p className="acc-rate-display">
                {sellerKycData?.commissionAgreement?.agreedRate ?? user?.commissionAgreement?.agreedRate ?? 10}%
              </p>
            </div>
          </div>

          {/* Real-time Balances */}
          <div className="acc-balances-grid">
            <div className="acc-bal-card">
              <strong style={{ color: "#059669" }}>
                ETB {fmt(sellerKycData?.sellerCredits ?? user?.sellerCredits ?? 0)}
              </strong>
              <span>Available Net Credits</span>
            </div>
            <div className="acc-bal-card">
              <strong style={{ color: "#D97706" }}>
                ETB {fmt(sellerKycData?.pendingSellerCredits ?? user?.pendingSellerCredits ?? 0)}
              </strong>
              <span>Pending Order Escrow</span>
            </div>
            <div className="acc-bal-card">
              <strong style={{ color: "#2563EB" }}>
                ETB {fmt(sellerKycData?.totalCommissionDebited ?? user?.totalCommissionDebited ?? 0)}
              </strong>
              <span>Total Commission Debited</span>
            </div>
          </div>

          {/* Bank / Telebirr Payout Configuration Form */}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
            Disbursement Payout Account
          </h3>
          <p style={{ fontSize: 13.5, color: "#64748B", marginBottom: 18 }}>
            Where platform finance transfers your net earnings upon withdrawal request
          </p>

          <form className="acc-form" onSubmit={handlePayoutSubmit}>
            <div className="acc-form-grid">
              <div className="acc-field-group">
                <label>Commercial Bank Name</label>
                <input
                  type="text"
                  className="acc-input"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE), Awash"
                />
              </div>

              <div className="acc-field-group">
                <label>Account Holder Full Name</label>
                <input
                  type="text"
                  className="acc-input"
                  value={payoutForm.accountHolder}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                  placeholder="Full name as shown on bank account"
                />
              </div>
            </div>

            <div className="acc-form-grid">
              <div className="acc-field-group">
                <label>Bank Account Number / IBAN</label>
                <input
                  type="text"
                  className="acc-input"
                  value={payoutForm.accountNumber}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                  placeholder="1000..."
                />
              </div>

              <div className="acc-field-group">
                <label>Telebirr Phone Number</label>
                <input
                  type="tel"
                  className="acc-input"
                  value={payoutForm.telebirrPhone}
                  onChange={(e) => setPayoutForm({ ...payoutForm, telebirrPhone: e.target.value })}
                  placeholder="+251 9..."
                />
              </div>
            </div>

            <button type="submit" className="acc-btn-primary" disabled={loading}>
              {loading ? "Updating Account..." : "Save Payout Details"}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 5: OWNER / ADMIN GLOBAL COMMISSION & RULES ── */}
      {(user?.role === "owner" || user?.role === "admin") && activeTab === "global-commission" && (
        <div className="acc-card">
          <h2 className="acc-card-title">Global Commission Policy & Gateway Rules</h2>
          <p className="acc-card-subtitle">
            Configure default platform commission debited to Finance across all sellers
          </p>

          {/* Ledger Totals Overview */}
          {globalSettings && (
            <div className="acc-balances-grid" style={{ marginBottom: 24 }}>
              <div className="acc-bal-card">
                <strong style={{ color: "#2563EB" }}>
                  ETB {fmt(globalSettings.platformTotalRevenue || 0)}
                </strong>
                <span>Platform Gross Order Volume</span>
              </div>
              <div className="acc-bal-card">
                <strong style={{ color: "#059669" }}>
                  ETB {fmt(globalSettings.platformTotalCommission || 0)}
                </strong>
                <span>Cumulative Debited Platform Commission</span>
              </div>
              <div className="acc-bal-card">
                <strong style={{ color: "#7C3AED" }}>
                  {globalSettings.defaultCommissionRate || 10}%
                </strong>
                <span>Global Baseline Rate</span>
              </div>
            </div>
          )}

          <form className="acc-form" onSubmit={handleGlobalSubmit}>
            <div className="acc-form-grid">
              <div className="acc-field-group">
                <label>Default Commission Model</label>
                <select
                  className="acc-input"
                  value={globalForm.defaultCommissionType}
                  onChange={(e) => setGlobalForm({ ...globalForm, defaultCommissionType: e.target.value })}
                >
                  <option value="percentage">Percentage per Item Price (%)</option>
                  <option value="fixed">Fixed Birr Fee per Item (ETB)</option>
                </select>
              </div>

              <div className="acc-field-group">
                <label>
                  Default Rate ({globalForm.defaultCommissionType === "percentage" ? "%" : "ETB"})
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="acc-input"
                  value={globalForm.defaultCommissionRate}
                  onChange={(e) => setGlobalForm({ ...globalForm, defaultCommissionRate: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="acc-field-group">
              <label>Manual Payment & Offline Transfer Instructions</label>
              <textarea
                className="acc-input"
                style={{ height: "100px", padding: "10px 14px", resize: "vertical" }}
                value={globalForm.instructions}
                onChange={(e) => setGlobalForm({ ...globalForm, instructions: e.target.value })}
                placeholder="Instructions displayed to buyers during checkout for manual CBE / Telebirr transfers..."
              />
            </div>

            <button type="submit" className="acc-btn-primary" disabled={loading}>
              {loading ? "Updating Rules..." : "Save Global Rules"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
