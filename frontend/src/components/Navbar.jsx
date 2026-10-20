import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
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
import { useCurrency } from "../context/CurrencyContext";
import api, { BASE_URL } from "../services/api";
import { handleImageError } from "../utils/imageFallback";
import oictLogo        from "../assets/OICT logo.jpg";
import "../styles/navbar.css";

const Navbar = () => {
  const { t }          = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [keyword,  setKeyword]  = useState("");
  const imgInputRef = useRef(null);
  const searchWrapRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { cartCount } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentFilter = searchParams.get("filter");
  const currentPath = location.pathname;

  const isHomeActive = currentPath === "/";
  const isProductsActive = currentPath === "/products" && !currentFilter;
  const isDealsActive = currentPath === "/deals" || (currentPath === "/products" && currentFilter === "deals");
  const isNewArrivalsActive = currentPath === "/new-arrivals" || (currentPath === "/products" && currentFilter === "new-arrivals");
  const isBrandsActive = currentPath === "/brands" || (currentPath === "/products" && currentFilter === "brands");
  const isContactActive = currentPath === "/contact";

  // Instant Search Autocomplete Debounce
  useEffect(() => {
    const q = keyword.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/products", {
          params: { keyword: q, limit: 5 },
        });
        const prods = (res.data?.products || []).slice(0, 5);
        setSuggestions(prods);
        setShowDropdown(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const v = keyword.trim();
    if (!v) return;
    setShowDropdown(false);
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

          {/* Search with Live Autocomplete Preview */}
          <div className="search-wrap" ref={searchWrapRef}>
            <form className="search-box" onSubmit={handleSearch}>
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  if (e.target.value.trim().length >= 2) setShowDropdown(true);
                }}
                onFocus={() => {
                  if (keyword.trim().length >= 2) setShowDropdown(true);
                }}
                placeholder={t("nav.search")}
                aria-label={t("nav.search")}
                autoComplete="off"
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

            {/* Floating Autocomplete Dropdown */}
            {showDropdown && keyword.trim().length >= 2 && (
              <div className="search-dropdown">
                {isSearching ? (
                  <div className="search-dropdown-loading">
                    <span>Searching products...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="search-dropdown-header">
                      <span>Matching Products ({suggestions.length})</span>
                    </div>
                    <ul className="search-dropdown-list">
                      {suggestions.map((p) => {
                        const imgUrl = p.image?.startsWith("http")
                          ? p.image
                          : `${BASE_URL}${p.image?.startsWith("/") ? p.image : `/${p.image}`}`;
                        return (
                          <li key={p._id}>
                            <Link
                              to={`/product/${p._id}`}
                              className="search-dropdown-item"
                              onClick={() => {
                                setShowDropdown(false);
                                setKeyword("");
                              }}
                            >
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="search-item-thumb"
                                onError={(e) => handleImageError(e, "product")}
                              />
                              <div className="search-item-info">
                                <span className="search-item-name">{p.name}</span>
                                <div className="search-item-meta">
                                  <span className="search-item-cat">{p.category || "General"}</span>
                                  {p.brand && <span className="search-item-brand">· {p.brand}</span>}
                                </div>
                              </div>
                              <div className="search-item-price">
                                {formatPrice ? formatPrice(p.price) : `ETB ${Number(p.price).toLocaleString()}`}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="search-dropdown-footer">
                      <button
                        type="button"
                        onClick={(e) => {
                          handleSearch(e);
                          setShowDropdown(false);
                        }}
                      >
                        View all results for "{keyword.trim()}" →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="search-dropdown-empty">
                    No products found for "<strong>{keyword.trim()}</strong>"
                  </div>
                )}
              </div>
            )}
          </div>

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
              className="header-cart-btn"
              aria-label={`${t("nav.cart")}, ${cartCount} items`}
            >
              <div className="cart-badge-wrap">
                <FaShoppingCart style={{ fontSize: 20 }} />
                {cartCount > 0 && (
                  <span className="cart-badge">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="cart-label">{t("nav.cart")}</span>
                <span className="cart-total">
                  {cartCount} {cartCount !== 1 ? "items" : "item"}
                </span>
              </div>
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
            <Link to="/" className={isHomeActive ? "active nav-active" : ""}>{t("nav.home")}</Link>
            <Link to="/products" className={isProductsActive ? "active nav-active" : ""}>{t("nav.products")}</Link>
            <Link to="/products?filter=deals" className={isDealsActive ? "active nav-active" : ""}>
              {t("nav.deals")} <span className="nav-link-badge">HOT</span>
            </Link>
            <Link to="/products?filter=new-arrivals" className={isNewArrivalsActive ? "active nav-active" : ""}>{t("nav.newArrivals")}</Link>
            <Link to="/products?filter=brands" className={isBrandsActive ? "active nav-active" : ""}>{t("nav.brands")}</Link>
            <Link to="/contact" className={isContactActive ? "active nav-active" : ""}>{t("nav.contact")}</Link>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
