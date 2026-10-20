import { useTranslation } from "react-i18next";
import "../styles/infopage.css";

const ReturnsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container info-container--narrow">
        <h1>{t("returns.title", "Returns & Refund Policy")}</h1>
        <p className="info-meta">{t("returns.updated", "Last updated: January 2026")}</p>

        <div className="info-section">
          <h2>{t("returns.windowTitle", "Return Window")}</h2>
          <p>{t("returns.windowText", "You may return eligible products within 14 days of the delivery date.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("returns.eligibilityTitle", "Eligibility")}</h2>
          <p>{t("returns.eligibilityIntro", "To be eligible for a return, the product must be:")}</p>
          <ul>
            <li>{t("returns.eligibility1", "Unused and in original condition")}</li>
            <li>{t("returns.eligibility2", "In the original packaging with all accessories")}</li>
            <li>{t("returns.eligibility3", "Accompanied by the original receipt or order confirmation")}</li>
          </ul>
          <p>{t("returns.eligibilityExcluded", "The following items are not eligible for return: software (once opened), digital downloads, perishable goods, and items marked as non-returnable.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("returns.howTitle", "How to Initiate a Return")}</h2>
          <ol>
            <li>{t("returns.step1", "Contact us with your order number and reason for return.")}</li>
            <li>{t("returns.step2", "Our team will respond within 1–2 business days with return instructions.")}</li>
            <li>{t("returns.step3", "Ship the item to our return address using a trackable shipping method.")}</li>
            <li>{t("returns.step4", "Once received and inspected, we will process your refund within 5–7 business days.")}</li>
          </ol>
        </div>

        <div className="info-section">
          <h2>{t("returns.refundsTitle", "Refunds")}</h2>
          <p>{t("returns.refundsText", "Approved refunds are credited to the original payment method. Chapa payments are refunded to the original account. Cash on Delivery refunds are processed via bank transfer.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("returns.damagedTitle", "Damaged or Defective Items")}</h2>
          <p>{t("returns.damagedText", "If you received a damaged or defective item, contact us within 48 hours of delivery with photos. We will arrange a replacement or full refund at no cost to you.")}</p>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPage;