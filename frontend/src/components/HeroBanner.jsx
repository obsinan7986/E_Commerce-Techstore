import { Link } from "react-router-dom";
import { FaArrowRight, FaTruck, FaLock, FaUndo, FaHeadphones } from "react-icons/fa";
import "../styles/herobanner.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const SIDEBAR_CATS = [
  { label: "Smartphones",  to: "/category/Smartphones",  icon: "📱" },
  { label: "Laptops",      to: "/category/Laptops",      icon: "💻" },
  { label: "Tablets",      to: "/category/Tablets",      icon: "📲" },
  { label: "Accessories",  to: "/category/Accessories",  icon: "🎧" },
  { label: "Smart Watches",to: "/category/Smartwatches", icon: "⌚" },
  { label: "Cameras",      to: "/category/Cameras",      icon: "📷" },
  { label: "Headphones",   to: "/category/Headphones",   icon: "🎧" },
  { label: "Gaming",       to: "/category/Gaming",       icon: "🎮" },
  { label: "TV & Audio",   to: "/category/Televisions",  icon: "📺" },
];

const FEATURES = [
  { icon: <FaTruck />,       title: "Free Shipping",    sub: "On orders over ETB 5,000" },
  { icon: <FaLock />,        title: "Secure Payment",   sub: "100% secure payment"      },
  { icon: <FaUndo />,        title: "30-Day Returns",   sub: "Money back guarantee"      },
  { icon: <FaHeadphones />,  title: "24/7 Support",     sub: "Dedicated support"         },
];

const HeroBanner = () => (
  <>
    {/* Hero section with sidebar + banner */}
    <div className="hero-section">
      <div className="hero-layout">

        {/* Category sidebar */}
        <aside className="hero-sidebar">
          {SIDEBAR_CATS.map((c) => (
            <Link key={c.label} to={c.to} className="hero-sidebar-link">
              <span className="hero-sidebar-icon">{c.icon}</span>
              {c.label}
            </Link>
          ))}
          <div className="hero-sidebar-footer">
            <Link to="/products">View All Categories</Link>
          </div>
        </aside>

        {/* Main banner */}
        <div className="hero-main">

          {/* Discount badge */}
          <div className="hero-off-badge">
            <span className="off-label">UP TO</span>
            <span className="off-number">20%</span>
            <span className="off-pct">OFF</span>
          </div>

          {/* Text */}
          <div className="hero-text">
            <h1>
              New Era of
              <span className="hero-accent">Technology</span>
            </h1>
            <p>
              Discover the latest smartphones, laptops and accessories
              at the best prices.
            </p>
            <Link to="/products" className="hero-cta-btn">
              Shop Now <FaArrowRight size={13} />
            </Link>
          </div>

          {/* Product image */}
          <div className="hero-image-wrap">
            <img
              src={`${BASE}/uploads/Samsung-s25.jpg`}
              alt="Latest Technology Products"
              onError={(e) => { e.target.style.opacity = "0"; }}
            />
          </div>

          {/* Slider dots */}
          <div className="hero-dots">
            <span className="hero-dot active" />
            <span className="hero-dot" />
            <span className="hero-dot" />
            <span className="hero-dot" />
          </div>

        </div>
      </div>
    </div>

    {/* Feature strip */}
    <div className="features-strip">
      <div className="features-inner">
        {FEATURES.map((f) => (
          <div className="feature-item" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-text">
              <strong>{f.title}</strong>
              <span>{f.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default HeroBanner;
