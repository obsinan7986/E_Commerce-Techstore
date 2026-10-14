import { NavLink, Link } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiUserCheck,
  FiCreditCard,
  FiDollarSign,
  FiSettings,
  FiMessageSquare,
  FiCalendar,
  FiBell,
  FiTag,
  FiStar,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiBriefcase,
  FiUser,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export const getNavSections = (role) => {
  if (role === "owner") {
    return [
      {
        heading: "CEO Overview",
        items: [
          { label: "Owner Dashboard", path: "/owner/dashboard", icon: FiShield },
          { label: "Store Operations", path: "/admin/dashboard", icon: FiGrid },
          { label: "Sales Analytics", path: "/admin/analytics", icon: FiTrendingUp },
        ],
      },
      {
        heading: "Governance & Review",
        items: [
          { label: "User Management", path: "/owner/users", icon: FiUsers },
          { label: "Seller KYC Review", path: "/owner/kyc", icon: FiUserCheck },
          { label: "Product Approvals", path: "/admin/product-approvals", icon: FiCheckCircle },
          { label: "Customer Reviews", path: "/admin/reviews", icon: FiStar },
        ],
      },
      {
        heading: "Financials & Revenue",
        items: [
          { label: "Revenue & Split Ledger", path: "/finance/dashboard", icon: FiDollarSign },
          { label: "Order Payments", path: "/finance/payments", icon: FiCreditCard },
          { label: "Payment Gateway Rules", path: "/admin/payment-settings", icon: FiSettings },
        ],
      },
      {
        heading: "Enterprise Comm",
        items: [
          { label: "Staff Meetings", path: "/comm/meetings", icon: FiCalendar },
          { label: "Announcements", path: "/comm/announcements", icon: FiBell },
          { label: "Schedule Calendar", path: "/comm/schedule", icon: FiClock },
        ],
      },
      {
        heading: "System",
        items: [
          { label: "Account & Settings", path: "/account/settings", icon: FiSettings },
        ],
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        heading: "Store Management",
        items: [
          { label: "Admin Dashboard", path: "/admin/dashboard", icon: FiGrid },
          { label: "Analytics & Reports", path: "/admin/analytics", icon: FiTrendingUp },
          { label: "Order Fulfillment", path: "/admin/orders", icon: FiShoppingBag },
          { label: "Catalog Products", path: "/admin/products", icon: FiPackage },
          { label: "Product Approvals", path: "/admin/product-approvals", icon: FiCheckCircle },
          { label: "Manual Payments", path: "/admin/manual-payments", icon: FiCreditCard },
          { label: "Discount Coupons", path: "/admin/coupons", icon: FiTag },
          { label: "Reviews Moderation", path: "/admin/reviews", icon: FiStar },
          { label: "Hero Banners", path: "/admin/banners", icon: FiImage },
        ],
      },
      {
        heading: "Communication",
        items: [
          { label: "Message Inbox", path: "/admin/messages", icon: FiMessageSquare },
          { label: "Notifications", path: "/admin/notifications", icon: FiBell },
          { label: "Meetings", path: "/comm/meetings", icon: FiCalendar },
          { label: "Announcements", path: "/comm/announcements", icon: FiBriefcase },
        ],
      },
      {
        heading: "Settings",
        items: [
          { label: "Payment Settings", path: "/admin/payment-settings", icon: FiSettings },
          { label: "Account Settings", path: "/account/settings", icon: FiUser },
        ],
      },
    ];
  }

  if (role === "finance") {
    return [
      {
        heading: "Financial Ledger",
        items: [
          { label: "Finance Dashboard", path: "/finance/dashboard", icon: FiDollarSign },
          { label: "All Payments & Splits", path: "/finance/payments", icon: FiCreditCard },
        ],
      },
      {
        heading: "Staff & Meetings",
        items: [
          { label: "Team Meetings", path: "/comm/meetings", icon: FiCalendar },
          { label: "Announcements", path: "/comm/announcements", icon: FiBriefcase },
        ],
      },
      {
        heading: "Account",
        items: [
          { label: "Account Settings", path: "/account/settings", icon: FiSettings },
        ],
      },
    ];
  }

  if (role === "seller") {
    return [
      {
        heading: "Seller Center",
        items: [
          { label: "Seller Dashboard", path: "/seller/dashboard", icon: FiGrid },
          { label: "Product Reviews", path: "/seller/reviews", icon: FiStar },
        ],
      },
      {
        heading: "Communications",
        items: [
          { label: "Message Center", path: "/messages", icon: FiMessageSquare },
          { label: "Team Meetings", path: "/comm/meetings", icon: FiCalendar },
          { label: "Announcements", path: "/comm/announcements", icon: FiBriefcase },
        ],
      },
      {
        heading: "Finances & Settings",
        items: [
          { label: "Payout Bank & Settings", path: "/account/settings?tab=payout", icon: FiDollarSign },
          { label: "Account Profile", path: "/account/settings", icon: FiUser },
        ],
      },
    ];
  }

  // Customer default
  return [
    {
      heading: "Customer Account",
      items: [
        { label: "My Orders", path: "/orders", icon: FiShoppingBag },
        { label: "Payment History", path: "/payment-history", icon: FiCreditCard },
        { label: "Wishlist", path: "/wishlist", icon: FiStar },
        { label: "Notifications", path: "/notifications", icon: FiBell },
        { label: "Messages", path: "/messages", icon: FiMessageSquare },
        { label: "Account & Addresses", path: "/account/settings", icon: FiSettings },
      ],
    },
  ];
};

const ROLE_BADGE_MAP = {
  owner:    { label: "CEO / Owner",      cls: "dash-role-badge--owner" },
  admin:    { label: "Store Admin",      cls: "dash-role-badge--admin" },
  finance:  { label: "Finance Officer",  cls: "dash-role-badge--finance" },
  seller:   { label: "Verified Seller",  cls: "dash-role-badge--seller" },
  customer: { label: "Customer",         cls: "dash-role-badge--customer" },
};

const Sidebar = ({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role || "customer";
  const badge = ROLE_BADGE_MAP[role] || ROLE_BADGE_MAP.customer;
  const sections = getNavSections(role);

  return (
    <aside className={`dash-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Brand Header */}
      <div className="dash-sidebar-brand">
        <Link to="/" className="dash-brand-link" onClick={onCloseMobile}>
          <div className="dash-brand-icon">TS</div>
          <div className="dash-brand-text">
            <strong>TechStore</strong>
            <span>Enterprise SaaS</span>
          </div>
        </Link>
        <button
          type="button"
          className="dash-collapse-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {/* Role Badge */}
      <div className="dash-role-badge-wrap">
        <span className={`dash-role-badge ${badge.cls}`}>
          <FiShield size={12} />
          {badge.label}
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="dash-sidebar-nav">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="dash-nav-group">
            <div className="dash-nav-heading">{section.heading}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin/dashboard" || item.path === "/owner/dashboard" || item.path === "/seller/dashboard"}
                  className={({ isActive }) =>
                    `dash-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="dash-nav-icon">
                    <Icon />
                  </span>
                  <span className="dash-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Storefront Link */}
      <div className="dash-sidebar-footer">
        <Link to="/" className="dash-store-link" onClick={onCloseMobile} title="Back to TechStore">
          <FiArrowLeft size={16} />
          <span className="dash-nav-label">Back to Store</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
