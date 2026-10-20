import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaFacebook, FaTwitter, FaInstagram, FaYoutube,
  FaPhone, FaEnvelope, FaMapMarkerAlt,
} from "react-icons/fa";
import oictLogo from "../../assets/OICT logo.jpg";
import "../../styles/footer.css";

const Footer = () => {
  const { t }  = useTranslation();
  const year   = new Date().getFullYear();

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
              <a href="https://www.facebook.com/oictsolutions" target="_blank"
                rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
              <a href="https://twitter.com/oictsolutions" target="_blank"
                rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://www.instagram.com/oictsolutions" target="_blank"
                rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://www.youtube.com/@oictsolutions" target="_blank"
                rel="noopener noreferrer" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          {/* ── Shop ── */}
          <div className="footer-col">
            <h4>{t("nav.products")}</h4>
            <ul>
              <li><Link to="/products">{t("nav.products")}</Link></li>
              <li><Link to="/products?filter=deals">{t("nav.deals")}</Link></li>
              <li><Link to="/products?filter=new-arrivals">{t("nav.newArrivals")}</Link></li>
              <li><Link to="/products?filter=brands">{t("nav.brands")}</Link></li>
            </ul>
          </div>

          {/* ── Customer Service ── */}
          <div className="footer-col">
            <h4>Customer Service</h4>
            <ul>
              <li><Link to="/contact">{t("nav.contact")}</Link></li>
              <li><Link to="/shipping-info">Shipping Info</Link></li>
              <li><Link to="/returns">Returns &amp; Refunds</Link></li>
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* ── My Account ── */}
          <div className="footer-col">
            <h4>{t("nav.account")}</h4>
            <ul>
              <li><Link to="/login">{t("auth.signIn")}</Link></li>
              <li><Link to="/orders">{t("orders.title")}</Link></li>
              <li><Link to="/wishlist">{t("nav.wishlist")}</Link></li>
              <li><Link to="/profile">{t("profile.editProfile")}</Link></li>
            </ul>
          </div>

          {/* ── Connect ── */}
          <div className="footer-col">
            <h4>Connect With Us</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaPhone /></span>
                <span>Tel: 0902381111 | 0903439943</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaEnvelope /></span>
                <span>oictsolutions@gmail.com</span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon"><FaMapMarkerAlt /></span>
                <span>Lebu, Addis Ababa, Ethiopia</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {year} OICT_TechStore. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/returns">Return Policy</Link>
            <Link to="/shipping-info">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
