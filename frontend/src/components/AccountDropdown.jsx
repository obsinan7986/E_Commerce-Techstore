

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingBag, FiDollarSign, FiMessageSquare, FiCreditCard,
  FiHeart, FiTag, FiDatabase, FiLogOut, FiChevronRight,
} from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/account-dropdown.css";

/* ── Menu data  */
const PRIMARY_ITEMS = [
  { icon: <FiShoppingBag />,  label: "My Orders",      to: "/orders"                },
  { icon: <FiDollarSign />,   label: "My Coins",       to: "/account?section=coins" },
  { icon: <FiMessageSquare />,label: "Message Center", to: "/messages"              },
  { icon: <FiCreditCard />,   label: "Payment",        to: "/payment-history"       },
  { icon: <FiHeart />,        label: "Wish List",      to: "/wishlist"              },
  { icon: <FiTag />,          label: "My Coupons",     to: "/account?section=coupons" },
];

const SECONDARY_ITEMS = [
  { label: "Settings",               to: "/account?section=settings"    },
  { label: "Business",               to: "/account?section=business"    },
  { label: "DS Center",              to: "/account?section=dscenter"    },
  { label: "Seller Log In",          to: "/account?section=sellerlogin" },
  { label: "Return & Refund Policy", to: "/returns"                     },
  { label: "Help Center",            to: "/faq"                         },
];

/* ── Component ────────────────────────────────────────────────── */
const AccountDropdown = () => {
  const [open, setOpen]       = useState(false);
  const wrapRef               = useRef(null);

  const { user, logout, isAdmin } = useAuth();
  const { resetCartCount }        = useCart();
  const navigate                  = useNavigate();

  /* Close on outside click — wraps trigger + panel */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const close     = ()  => setOpen(false);
  const toggle    = ()  => setOpen((p) => !p);

  const handleLogout = () => {
    logout();
    if (typeof resetCartCount === "function") resetCartCount();
    close();
    navigate("/");
  };

  return (
    /* Single ref wraps BOTH trigger button and panel */
    <div className="acct-dropdown-wrap" ref={wrapRef}>

      {/* ── Trigger button ── */}
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
        <div
          className="acct-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Account menu"
        >
          {/* NOT logged in */}
          {!user ? (
            <div className="acct-auth">
              <Link to="/login"    className="acct-signin-btn"   onClick={close}>Sign in</Link>
              <Link to="/register" className="acct-register-link" onClick={close}>Register</Link>
            </div>
          ) : (
            /* Logged in — user info header */
            <div className="acct-user-info">
              <div className="acct-avatar" aria-hidden="true">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="acct-user-text">
                <span className="acct-user-name">{user.fullName}</span>
                <span className="acct-user-email">{user.email}</span>
                {isAdmin && <span className="acct-admin-chip">Admin</span>}
              </div>
            </div>
          )}

          <div className="acct-divider" role="separator" />

          {/* Primary menu */}
          <nav aria-label="Account navigation">
            {PRIMARY_ITEMS.map(({ icon, label, to }) => (
              <Link key={label} to={to} className="acct-menu-item" onClick={close}>
                <span className="acct-item-icon" aria-hidden="true">{icon}</span>
                <span className="acct-item-label">{label}</span>
                <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
              </Link>
            ))}

            {/* Admin shortcut */}
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className="acct-menu-item acct-menu-admin" onClick={close}>
                  <span className="acct-item-icon" aria-hidden="true"><FiDatabase /></span>
                  <span className="acct-item-label">Admin Dashboard</span>
                  <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
                </Link>
                <Link to="/admin/analytics" className="acct-menu-item acct-menu-admin" onClick={close}>
                  <span className="acct-item-icon" aria-hidden="true">📊</span>
                  <span className="acct-item-label">Analytics</span>
                  <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
                </Link>
                <Link to="/admin/coupons" className="acct-menu-item acct-menu-admin" onClick={close}>
                  <span className="acct-item-icon" aria-hidden="true">🏷</span>
                  <span className="acct-item-label">Coupons</span>
                  <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
                </Link>
                <Link to="/admin/messages" className="acct-menu-item acct-menu-admin" onClick={close}>
                  <span className="acct-item-icon" aria-hidden="true">💬</span>
                  <span className="acct-item-label">Customer Messages</span>
                  <FiChevronRight className="acct-item-arrow" aria-hidden="true" />
                </Link>
              </>
            )}
          </nav>

          <div className="acct-divider" role="separator" />

          {/* Secondary menu */}
          <nav aria-label="Account secondary navigation">
            {SECONDARY_ITEMS.map(({ label, to }) => (
              <Link key={label} to={to} className="acct-secondary-item" onClick={close}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Sign out — only when logged in */}
          {user && (
            <>
              <div className="acct-divider" role="separator" />
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
