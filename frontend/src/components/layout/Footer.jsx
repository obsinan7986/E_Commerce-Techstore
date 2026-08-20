import { Link } from "react-router-dom";
import {
  FaFacebook, FaTwitter, FaInstagram, FaYoutube,
  FaPhone, FaEnvelope, FaMapMarkerAlt,
} from "react-icons/fa";
import oictLogo from "../../assets/OICT logo.jpg";
import "../../styles/footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-grid">

          {/* ── Brand ── */}
          <div className="footer-col footer-brand-col">
            <Link to="/" className="footer-logo">
              <img src={oictLogo} alt="OICT_TechStore" className="footer-logo-img" />
              OICT_TechStore
            </Link>
            <p className="footer-tagline">
              Your trusted destination for the latest technology and electronics.
              Quality products, best prices, exceptional service.
            </p>
            <div className="footer-social">
              <a
                href="https://www.facebook.com/fikadu.tesfayedamesa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a
                href="https://www.instagram.com/obsa1213"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.youtube.com/@Obsaesfaye-86"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
            </div>
          </div>

          {/* ── Shop ── */}
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products">Deals</Link></li>
              <li><Link to="/products">New Arrivals</Link></li>
              <li><Link to="/products">Best Sellers</Link></li>
              <li><Link to="/products">Clearance</Link></li>
            </ul>
          </div>

          {/* ── Customer Service ── */}
          <div className="footer-col">
            <h4>Customer Service</h4>
            <ul>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/shipping-info">Shipping Information</Link></li>
              <li><Link to="/returns">Returns &amp; Refunds</Link></li>
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* ── My Account ── */}
          <div className="footer-col">
            <h4>My Account</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/profile">Account Settings</Link></li>
            </ul>
          </div>

          {/* ── Connect ── */}
          <div className="footer-col">
            <h4>Connect With Us</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaPhone /></span>
                <span>+251 931 597 986</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaEnvelope /></span>
                <span>obsatesfaye6370@gmail.com</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaMapMarkerAlt /></span>
                <span>Ayer Tena, Addis Ababa, Ethiopia</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <p>© {year} OICT_TechStore. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/returns">Return Policy</Link>
          <Link to="/shipping-info">Shipping Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;