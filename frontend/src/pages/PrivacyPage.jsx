import { useTranslation } from "react-i18next";
import "../styles/infopage.css";

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container info-container--narrow">
        <h1>{t("privacy.title", "Privacy Policy")}</h1>
        <p className="info-meta">{t("privacy.updated", "Last updated: January 2026")}</p>

        <div className="info-section">
          <h2>{t("privacy.s1Title", "1. Information We Collect")}</h2>
          <p>{t("privacy.s1Text", "When you create an account or place an order, we collect your name, email address, phone number, shipping address, and payment transaction references. We do not store full card numbers or CVV codes.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("privacy.s2Title", "2. How We Use Your Information")}</h2>
          <ul>
            <li>{t("privacy.s2Item1", "To process and fulfill your orders")}</li>
            <li>{t("privacy.s2Item2", "To communicate order status and updates")}</li>
            <li>{t("privacy.s2Item3", "To provide customer support")}</li>
            <li>{t("privacy.s2Item4", "To improve our products and services")}</li>
          </ul>
        </div>

        <div className="info-section">
          <h2>{t("privacy.s3Title", "3. Information Sharing")}</h2>
          <p>{t("privacy.s3Text", "We do not sell or rent your personal information to third parties. We share data only with service providers necessary to fulfill your order (e.g., payment processors, delivery services), and only to the extent required.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("privacy.s4Title", "4. Data Security")}</h2>
          <p>{t("privacy.s4Text", "We use industry-standard security measures to protect your personal information. Passwords are stored using one-way hashing. Payment processing is handled by trusted third-party gateways.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("privacy.s5Title", "5. Cookies")}</h2>
          <p>{t("privacy.s5Text", "We use cookies and local storage to maintain your session and shopping cart. No advertising or tracking cookies are used.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("privacy.s6Title", "6. Your Rights")}</h2>
          <p>{t("privacy.s6Text", "You may request deletion of your account and associated data by contacting us at obsatesfaye6370@gmail.com.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("contact.title", "Contact")}</h2>
          <p>
            {t("contact.lead", "For privacy-related questions, contact us at:")}{" "}
            <a href="mailto:obsatesfaye6370@gmail.com" style={{ color: "var(--primary)" }}>obsatesfaye6370@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;