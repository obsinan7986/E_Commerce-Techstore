/**
 * Generic account sub-page placeholder.
 * "payment" section now redirects to the real Payment History page.
 */
import { useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import "../styles/infopage.css";

const SECTIONS = {
  coins:        { title: "My Coins",       icon: "🪙", desc: "View and redeem your TechStore reward coins." },
  messages:     { title: "Message Center", icon: "💬", desc: "Read and manage your messages from sellers and TechStore." },
  coupons:      { title: "My Coupons",     icon: "🏷️", desc: "View and use your available discount coupons." },
  settings:     { title: "Settings",       icon: "⚙️", desc: "Manage your account preferences and security settings." },
  business:     { title: "Business",       icon: "🏢", desc: "Access TechStore business tools and seller resources." },
  dscenter:     { title: "DS Center",      icon: "📦", desc: "Dropshipping center — manage your DS products and orders." },
  sellerlogin:  { title: "Seller Log In",  icon: "🔐", desc: "Log in to the TechStore seller portal." },
};

const AccountPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const key      = params.get("section") || "settings";

  // Redirect payment section to real page
  useEffect(() => {
    if (key === "payment") {
      navigate("/payment-history", { replace: true });
    }
    if (key === "messages") {
      navigate("/messages", { replace: true });
    }
  }, [key, navigate]);

  const section = SECTIONS[key] || SECTIONS.settings;

  // While redirecting don't render placeholder
  if (key === "payment" || key === "messages") return null;

  return (
    <div className="info-page">
      <div className="info-container info-container--narrow">
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ fontSize: 54, marginBottom: 16 }}>{section.icon}</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>{section.title}</h1>
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
            {section.desc}
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "#F1F5F9",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            color: "#64748B",
            fontSize: 14,
            marginBottom: 32,
          }}>
            🚧 &nbsp;This feature is coming soon.
          </div>
          <br />
          <Link to="/profile" className="info-btn">Go to Profile</Link>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
