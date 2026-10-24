import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiLogOut, FiUser, FiSettings, FiShoppingBag, FiChevronDown, FiCamera } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import NotificationBell from "../NotificationBell";
import AdminNotificationBell from "../AdminNotificationBell";

const PATH_TITLES = {
  "/owner/dashboard":        { title: "CEO Executive Dashboard", sub: "Strategic oversight, KYC verification & governance" },
  "/owner/users":            { title: "User Management", sub: "Manage roles, accounts and suspensions" },
  "/owner/kyc":              { title: "Seller KYC Review", sub: "Verify identity documents and set agreed commission" },
  "/admin":                  { title: "Store Operations", sub: "E-commerce store catalog & order processing" },
  "/admin/dashboard":        { title: "Admin Dashboard", sub: "Operations overview and critical action items" },
  "/admin/analytics":        { title: "Store Analytics", sub: "Revenue reports and order volume trends" },
  "/admin/orders":           { title: "Order Management", sub: "Track, process and fulfill customer orders" },
  "/admin/products":         { title: "Product Catalog", sub: "Manage products, inventory, and categories" },
  "/admin/product-approvals":{ title: "Product Approvals", sub: "Review seller product submissions and commission overrides" },
  "/admin/manual-payments":  { title: "Manual Payments", sub: "Verify customer payment slips and receipts" },
  "/admin/payment-settings": { title: "Payment Gateway Rules", sub: "Configure bank accounts and global commission defaults" },
  "/admin/coupons":          { title: "Promotions & Coupons", sub: "Create and manage store discount codes" },
  "/admin/messages":         { title: "Staff Messages", sub: "Internal support and vendor communications" },
  "/admin/notifications":    { title: "System Alerts", sub: "All store notifications and order updates" },
  "/admin/banners":          { title: "Hero Banners", sub: "Customize promotional carousel slides" },
  "/admin/reviews":          { title: "Reviews Moderation", sub: "Audit and moderate customer product reviews" },
  "/finance":                { title: "Finance Dashboard", sub: "Gross sales, debited commission revenue & seller net liability" },
  "/finance/dashboard":      { title: "Finance Dashboard", sub: "Gross sales, debited commission revenue & seller net liability" },
  "/finance/payments":       { title: "Payments & Split Ledger", sub: "Itemized transaction ledger and commission split tracking" },
  "/seller":                 { title: "Seller Portal", sub: "Manage listing catalog, sales metrics and payouts" },
  "/seller/dashboard":       { title: "Seller Dashboard", sub: "Sales performance, available credits and product catalog" },
  "/seller/reviews":         { title: "Product Reviews", sub: "Customer reviews on your products" },
  "/account":                { title: "Account & Settings", sub: "Manage profile info, passwords, addresses and payouts" },
  "/account/settings":       { title: "Account & Settings", sub: "Manage profile info, passwords, addresses and payouts" },
  "/profile":                { title: "Profile Info", sub: "Update personal account information and addresses" },
  "/orders":                 { title: "My Orders", sub: "Track order status and view order history" },
  "/payment-history":        { title: "Payment History", sub: "View transaction receipts and payment statuses" },
  "/notifications":          { title: "Notifications", sub: "Order updates and platform messages" },
  "/messages":               { title: "Message Center", sub: "Direct communication with sellers and support" },
  "/comm/meetings":          { title: "Staff Meetings", sub: "Internal video meetings and team calls" },
  "/comm/announcements":     { title: "Announcements", sub: "Company-wide updates and policy notifications" },
  "/comm/schedule":          { title: "Schedule Calendar", sub: "Team calendar and upcoming deadlines" },
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
};

const DashboardHeader = ({ onToggleMobile }) => {
  const { user, logout, updateUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const meta = PATH_TITLES[location.pathname] || {
    title: "Dashboard",
    sub: "Manage your TechStore workspace",
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";
  const handleDashAvatarUpload = async (e) => {
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
      if (updateUser) {
        updateUser({ avatar: url, profileImage: url });
      }
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile picture.");
    } finally {
      e.target.value = "";
      setUploadingAvatar(false);
    }
  };


  return (
    <header className="dash-header">
      {/* Left Title & Mobile Toggle */}
      <div className="dash-header-left">
        <button
          type="button"
          className="dash-mobile-toggle"
          aria-label="Toggle menu"
          onClick={onToggleMobile}
        >
          <FiMenu />
        </button>
        <div>
          <h1 className="dash-header-title">{meta.title}</h1>
          <div className="dash-header-sub">{meta.sub}</div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="dash-header-right">
        {/* Currency Switcher */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="dash-currency-select"
          title="Change display currency"
        >
          <option value="ETB">ETB (Birr)</option>
          <option value="USD">USD ($)</option>
        </select>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          {isAdminOrOwner ? <AdminNotificationBell /> : <NotificationBell />}
        </div>

        {/* User Avatar Menu */}
        <div className="dash-user-menu" ref={menuRef}>
          <button
            type="button"
            className="dash-user-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <div className="dash-avatar-circle" style={{ overflow: "hidden" }}>
              {(user?.avatar || user?.profileImage) ? (
                <img
                  src={user.avatar || user.profileImage}
                  alt={user?.fullName || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                getInitials(user?.fullName)
              )}
            </div>
            <div className="dash-user-meta">
              <div className="dash-user-name">{user?.fullName || "User"}</div>
              <div className="dash-user-role">{user?.role || "Account"}</div>
            </div>
            <FiChevronDown size={14} color="#64748b" />
          </button>

          {dropdownOpen && (
            <div className="dash-dropdown">
              <Link
                to="/account/settings"
                className="dash-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiUser size={16} />
                <span>Account Profile</span>
              </Link>

              <label
                htmlFor="dash-avatar-file-input"
                className="dash-dropdown-item"
                style={{ cursor: "pointer", margin: 0 }}
              >
                <FiCamera size={16} />
                <span>{uploadingAvatar ? "Uploading…" : "Change Photo"}</span>
                <input
                  id="dash-avatar-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleDashAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>

              {user?.role === "seller" && (
                <Link
                  to="/account/settings?tab=payout"
                  className="dash-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FiSettings size={16} />
                  <span>Payout Bank & Telebirr</span>
                </Link>
              )}

              <Link
                to="/"
                className="dash-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiShoppingBag size={16} />
                <span>Back to Storefront</span>
              </Link>

              <div className="dash-dropdown-divider" />

              <button
                type="button"
                className="dash-dropdown-item danger"
                onClick={handleLogout}
              >
                <FiLogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
