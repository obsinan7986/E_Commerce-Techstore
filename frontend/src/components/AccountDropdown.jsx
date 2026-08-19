import { useState, useEffect, useRef } from "react";
import { Link, useNavigate }          from "react-router-dom";
import {
  FiShoppingBag, FiMessageSquare, FiCreditCard,
  FiHeart, FiUser, FiBell, FiDatabase,
  FiLogOut, FiChevronRight, FiShoppingCart,
  FiUsers, FiTag, FiBarChart2,
} from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import { useAuth }  from "../context/AuthContext";
import { useCart }  from "../context/CartContext";
import "../styles/account-dropdown.css";

/* ─────────────────────────────────────────────────────────────
   CUSTOMER menu — every item has a real, working route
   ───────────────────────────────────────────────────────────── */
const CUSTOMER_ITEMS = [
  { icon: <FiUser />,         label: "My Profile",       to: "/profile"          },
  { icon: <FiShoppingBag />,  label: "My Orders",        to: "/orders"           },
  { icon: <FiCreditCard />,   label: "Payment History",  to: "/payment-history"  },
  { icon: <FiHeart />,        label: "Wishlist",         to: "/wishlist"         },
  { icon: <FiMessageSquare />,label: "Message Center",   to: "/messages"         },
  { icon: <FiBell />,         label: "Notifications",    to: "/notifications"    },
];

/* ─────────────────────────────────────────────────────────────
   ADMIN menu — each link once, all with real pages
   ───────────────────────────────────────────────────────────── */
const ADMIN_ITEMS = [
  { icon: <FiDatabase />,    label: "Dashboard",           to: "/admin/dashboard"          },
  { icon: <FiBarChart2 />,   label: "Analytics",           to: "/admin/analytics"          },
  { icon: <FiShoppingCart />,label: "Orders",              to: "/admin/orders"             },
  { icon: "📦",              label: "Products",            to: "/admin/products"           },
  { icon: "✅",              label: "Product Approvals",   to: "/admin/product-approvals"  },
  { icon: <FiUsers />,       label: "Users",               to: "/admin/users"              },
  { icon: <FiTag />,         label: "Coupons",             to: "/admin/coupons"            },
  { icon: <FiCreditCard />,  label: "Payments",            to: "/admin/manual-payments"    },
  { icon: <FiMessageSquare />,label: "Customer Messages",  to: "/admin/messages"           },
];

const OWNER_ITEMS = [
  { icon: "👑",              label: "Owner Dashboard",     to: "/owner/dashboard"          },
  { icon: <FiUsers />,       label: "User Management",     to: "/owner/users"              },
  { icon: "🪪",              label: "KYC Review",          to: "/owner/kyc"                },
  { icon: <FiDatabase />,    label: "Admin Panel",         to: "/admin/dashboard"          },
  { icon: "✅",              label: "Product Approvals",   to: "/admin/product-approvals"  },
  { icon: <FiBarChart2 />,   label: "Analytics",           to: "/admin/analytics"          },
];

const SELLER_ITEMS = [
  { icon: "🏪",              label: "Seller Dashboard",    to: "/seller/dashboard"         },
  { icon: <FiUser />,        label: "My Profile",          to: "/profile"                  },
  { icon: <FiShoppingBag />, label: "My Orders",           to: "/orders"                   },
  { icon: <FiBell />,        label: "Notifications",       to: "/notifications"            },
];

/* ─────────────────────────────────────────────────────────────
   FOOTER links — real informational pages only
   ───────────────────────────────────────────────────────────── */
const FOOTER_ITEMS = [
  { label: "Return & Refund Policy", to: "/returns" },
  { label: "Help Center",            to: "/faq"     },
  { label: "Contact Us",             to: "/contact" },
];

/* ─────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────── */
const AccountDropdown = () => {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef(null);

  const { user, logout, isAdmin, isOwner, isSeller } = useAuth();
  const { resetCartCount }        = useCart();
  const navigate                  = useNavigate();

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn, true);
    return () => document.removeEventListener("mousedown", fn, true);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open]);

  const close  = () => setOpen(false);
  const toggle = () => setOpen((p) => !p);

  const handleLogout = () => {
    logout();
    if (typeof resetCartCount === "function") resetCartCount();
    close();
    navigate("/");
  };

  const MenuItem = ({ icon, label, to, className = "acct-menu-item" }) => (
    <Link to={to} className={className} onClick={close}>
      <span className="acct-item-icon" aria-hidden="true">
        {typeof icon === "string" ? icon : icon}
      </span>
      <span className="acct-item-label">{label}</span>
      <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
    </Link>
  );

  return (
    <div className="acct-dropdown-wrap" ref={wrapRef}>

      {/* ── Trigger ── */}
      <button
        type="button"
        className="header-icon-btn"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <FaUser style={{ fontSize: 18 }} />
        <span className="icon-label">Account</span>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="acct-panel" role="dialog" aria-modal="true" aria-label="Account menu">

          {/* ── Not logged in ── */}
          {!user ? (
            <>
              <div className="acct-auth">
                <Link to="/login"    className="acct-signin-btn"    onClick={close}>Sign In</Link>
                <Link to="/register" className="acct-register-link" onClick={close}>Register</Link>
              </div>
              <div className="acct-divider" role="separator" />
              <nav aria-label="Info links">
                {FOOTER_ITEMS.map(({ label, to }) => (
                  <Link key={label} to={to} className="acct-secondary-item" onClick={close}>{label}</Link>
                ))}
              </nav>
            </>
          ) : (
            <>
              {/* ── User info header ── */}
              <div className="acct-user-info">
                <div className="acct-avatar" aria-hidden="true">
                  {user.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="acct-user-text">
                  <span className="acct-user-name">{user.fullName}</span>
                  <span className="acct-user-email">{user.email}</span>
                {isAdmin && <span className="acct-admin-chip">
                  {isOwner ? "Owner" : "Admin"}
                </span>}
                {isSeller && !isOwner && !isAdmin && <span className="acct-admin-chip acct-seller-chip">Seller</span>}
                </div>
              </div>

              <div className="acct-divider" role="separator" />

              {/* ── Role-based menu ── */}
              {isOwner ? (
                <nav aria-label="Owner navigation">
                  <p className="acct-section-label">Owner Panel</p>
                  {OWNER_ITEMS.map(({ icon, label, to }) => (
                    <MenuItem key={label} icon={icon} label={label} to={to} className="acct-menu-item acct-menu-admin" />
                  ))}
                </nav>
              ) : isAdmin ? (
                <nav aria-label="Admin navigation">
                  <p className="acct-section-label">Admin Panel</p>
                  {ADMIN_ITEMS.map(({ icon, label, to }) => (
                    <MenuItem key={label} icon={icon} label={label} to={to} className="acct-menu-item acct-menu-admin" />
                  ))}
                </nav>
              ) : isSeller ? (
                <nav aria-label="Seller navigation">
                  <p className="acct-section-label">Seller Panel</p>
                  {SELLER_ITEMS.map(({ icon, label, to }) => (
                    <MenuItem key={label} icon={icon} label={label} to={to} className="acct-menu-item acct-menu-admin" />
                  ))}
                </nav>
              ) : (
                /* ── Customer menu ── */
                <nav aria-label="Account navigation">
                  {CUSTOMER_ITEMS.map(({ icon, label, to }) => (
                    <MenuItem key={label} icon={icon} label={label} to={to} />
                  ))}
                </nav>
              )}

              <div className="acct-divider" role="separator" />

              {/* ── Footer info links ── */}
              <nav aria-label="Info links">
                {FOOTER_ITEMS.map(({ label, to }) => (
                  <Link key={label} to={to} className="acct-secondary-item" onClick={close}>{label}</Link>
                ))}
              </nav>

              <div className="acct-divider" role="separator" />

              {/* ── Sign out ── */}
              <button type="button" className="acct-logout-btn" onClick={handleLogout}>
                <FiLogOut aria-hidden="true" />
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountDropdown;
