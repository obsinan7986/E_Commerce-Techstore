import { useTranslation } from "react-i18next";
import "../styles/infopage.css";

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container info-container--narrow">
        <h1>{t("terms.title", "Terms & Conditions")}</h1>
        <p className="info-meta">{t("terms.updated", "Last updated: January 2026")}</p>

        <div className="info-section">
          <h2>{t("terms.s1Title", "1. Acceptance of Terms")}</h2>
          <p>{t("terms.s1Text", "By accessing and using TechStore, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s2Title", "2. Use of the Platform")}</h2>
          <p>{t("terms.s2Text", "You agree to use TechStore only for lawful purposes. You must not use the platform to distribute malware, conduct fraud, or harass other users.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s3Title", "3. Account Responsibility")}</h2>
          <p>{t("terms.s3Text", "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s4Title", "4. Orders and Payments")}</h2>
          <p>{t("terms.s4Text", "All orders are subject to availability and confirmation. Prices may change without notice. A confirmed order constitutes a binding contract between you and TechStore.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s5Title", "5. Product Information")}</h2>
          <p>{t("terms.s5Text", "We make every effort to display products accurately. However, we cannot guarantee that product images, descriptions, or prices are error-free. We reserve the right to correct errors.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s6Title", "6. Limitation of Liability")}</h2>
          <p>{t("terms.s6Text", "TechStore is not liable for indirect, incidental, or consequential damages arising from the use or inability to use our services.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s7Title", "7. Governing Law")}</h2>
          <p>{t("terms.s7Text", "These terms are governed by the laws of the Federal Democratic Republic of Ethiopia.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("terms.s8Title", "8. Contact")}</h2>
          <p>
            {t("terms.s8Text", "For questions about these terms, contact us at:")}{" "}
            <a href="mailto:obsatesfaye6370@gmail.com" style={{ color: "var(--primary)" }}>obsatesfaye6370@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;