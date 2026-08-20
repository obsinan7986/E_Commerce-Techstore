import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FaSearch, FaHeart, FaShoppingCart,
  FaBars, FaChevronDown,
} from "react-icons/fa";
import MegaMenu           from "./MegaMenu";
import AccountDropdown    from "./AccountDropdown";
import NotificationBell   from "./NotificationBell";
import { useCart }        from "../context/CartContext";
import "../styles/navbar.css";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [keyword,  setKeyword]  = useState("");

  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const v = keyword.trim();
    if (!v) return;
    navigate(`/search/${encodeURIComponent(v)}`);
  };

  return (
    <>
      {/* ── Promo bar ── */}
      <div className="promo-bar">
        <span>🚚 Free shipping on all orders over ETB 5,000!</span>
      </div>

      {/* ── Main header ── */}
      <header className="header">
        <div className="header-inner">

          {/* Logo */}
          <div className="logo">
            <Link to="/">
              <img src="/oict-logo.png" alt="OICT_TechStore" className="logo-img" />
              <span>OICT_Tech<span className="logo-text-blue">Store</span></span>
            </Link>
          </div>

          {/* Search */}
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search for smartphones, laptops, accessories..."
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search">
              <FaSearch />
            </button>
          </form>

          {/* Right icons */}
          <div className="header-icons">

            {/* Wishlist */}
            <Link to="/wishlist" className="header-icon-btn" aria-label="Wishlist">
              <FaHeart style={{ fontSize: 19 }} />
              <span className="icon-label">Wishlist</span>
            </Link>

            {/* Notification bell */}
            <NotificationBell />

            {/* Account — self-contained: owns trigger + panel + open state */}
            <AccountDropdown />

            {/* Cart */}
            <Link
              to="/cart"
              className="header-cart-btn cart-badge-wrap"
              aria-label={`Cart, ${cartCount} items`}
            >
              <FaShoppingCart style={{ fontSize: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="cart-label">My Cart</span>
                <span className="cart-total">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </span>
              </div>
              {cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </header>

      {/* ── Navigation bar ── */}
      <nav className="nav" aria-label="Main navigation">
        <div className="nav-inner">

          {/* All Categories */}
          <div
            className="category-wrapper"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              type="button"
              className="category-btn"
              onClick={() => setShowMenu((p) => !p)}
              aria-expanded={showMenu}
            >
              <FaBars aria-hidden="true" />
              <span>All Categories</span>
              <FaChevronDown className="category-arrow" aria-hidden="true" />
            </button>
            {showMenu && (
              <div className="mega-menu-container">
                <MegaMenu />
              </div>
            )}
          </div>

          {/* Nav links */}
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/products">
              Deals <span className="nav-link-badge">HOT</span>
            </Link>
            <Link to="/products">New Arrivals</Link>
            <Link to="/products">Brands</Link>
            <Link to="/contact">Contact</Link>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
