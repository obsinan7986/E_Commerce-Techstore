import { Link } from "react-router-dom";
import { FaTruck, FaLock, FaUndo, FaHeadphones } from "react-icons/fa";
import PromoBannerSlider from "./PromoBannerSlider";
import "../styles/herobanner.css";

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

        {/* Main banner — dynamic promo slider */}
        <div className="hero-main">
          <PromoBannerSlider />
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
