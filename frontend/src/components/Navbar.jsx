import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaSearch, FaHeart, FaShoppingCart,
  FaBars, FaChevronDown, FaCamera,
} from "react-icons/fa";
import MegaMenu        from "./MegaMenu";
import AccountDropdown from "./AccountDropdown";
import NotificationBell from "./NotificationBell";
import LocaleSelector  from "./LocaleSelector";
import { useCart }     from "../context/CartContext";
import oictLogo        from "../assets/OICT logo.jpg";
import "../styles/navbar.css";

const Navbar = () => {
  const { t }          = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [keyword,  setKeyword]  = useState("");
  const imgInputRef = useRef(null);

  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const v = keyword.trim();
    if (!v) return;
    navigate(`/search/${encodeURIComponent(v)}`);
  };

  const handleImageSearch = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    navigate("/image-search", { state: { file } });
    e.target.value = "";
  };

  return (
    <>
      {/* ── Promo bar ── */}
      <div className="promo-bar">
        <span>{t("nav.freeShipping")}</span>
      </div>

      {/* ── Main header ── */}
      <header className="header">
        <div className="header-inner">

          {/* Logo */}
          <div className="logo">
            <Link to="/">
              <img src={oictLogo} alt="OICT_TechStore" className="logo-img" />
              <span>OICT_Tech<span className="logo-text-blue">Store</span></span>
            </Link>
          </div>

          {/* Search */}
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("nav.search")}
              aria-label={t("nav.search")}
            />
            <button
              type="button"
              className="search-img-btn"
              onClick={() => imgInputRef.current?.click()}
              aria-label={t("nav.searchByImage")}
              title={t("nav.searchByImage")}
            >
              <FaCamera size={14} />
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageSearch}
            />
            <button type="submit" aria-label={t("nav.search")}>
              <FaSearch />
            </button>
          </form>

          {/* Right icons */}
          <div className="header-icons">

            <Link to="/wishlist" className="header-icon-btn" aria-label={t("nav.wishlist")}>
              <FaHeart style={{ fontSize: 19 }} />
              <span className="icon-label">{t("nav.wishlist")}</span>
            </Link>

            <NotificationBell />

            <LocaleSelector />

            <AccountDropdown />

            <Link
              to="/cart"
              className="header-cart-btn cart-badge-wrap"
              aria-label={`${t("nav.cart")}, ${cartCount} items`}
            >
              <FaShoppingCart style={{ fontSize: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="cart-label">{t("nav.cart")}</span>
                <span className="cart-total">
                  {cartCount} {cartCount !== 1 ? "items" : "item"}
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
              <span>{t("nav.allCategories")}</span>
              <FaChevronDown className="category-arrow" aria-hidden="true" />
            </button>
            {showMenu && (
              <div className="mega-menu-container">
                <MegaMenu />
              </div>
            )}
          </div>

          <div className="nav-links">
            <Link to="/">{t("nav.home")}</Link>
            <Link to="/products">{t("nav.products")}</Link>
            <Link to="/products">
              {t("nav.deals")} <span className="nav-link-badge">HOT</span>
            </Link>
            <Link to="/products">{t("nav.newArrivals")}</Link>
            <Link to="/products">{t("nav.brands")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
