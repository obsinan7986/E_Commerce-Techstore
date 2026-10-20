import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/infopage.css";

const ShippingInfoPage = () => {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container info-container--narrow">
        <h1>{t("shipping.title", "Shipping Information")}</h1>
        <p className="info-meta">{t("shipping.updated", "Last updated: January 2026")}</p>

        <div className="info-section">
          <h2>{t("shipping.areasTitle", "Delivery Areas")}</h2>
          <p>{t("shipping.areasText", "OICT_TechStore currently delivers across Ethiopia. Delivery availability and timelines vary by location.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("shipping.timesTitle", "Delivery Times")}</h2>
          <table className="info-table">
            <thead>
              <tr>
                <th>{t("shipping.locationCol", "Location")}</th>
                <th>{t("shipping.deliveryCol", "Standard Delivery")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("shipping.addis", "Addis Ababa")}</td>
                <td>{t("shipping.addisTime", "1–3 business days")}</td>
              </tr>
              <tr>
                <td>{t("shipping.major", "Major cities (Dire Dawa, Hawassa, Bahir Dar, Ambo, Jimma, Wollega)")}</td>
                <td>{t("shipping.majorTime", "3–5 business days")}</td>
              </tr>
              <tr>
                <td>{t("shipping.other", "Other regions")}</td>
                <td>{t("shipping.otherTime", "5–10 business days")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="info-section">
          <h2>{t("shipping.feesTitle", "Shipping Fees")}</h2>
          <p>{t("shipping.feesFree", "Orders over ETB 5,000 qualify for free standard delivery within Addis Ababa.")}</p>
          <p>{t("shipping.feesFlat", "For orders below this threshold, a flat shipping fee of ETB 200 applies within Addis Ababa. Rates for other regions are calculated at checkout.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("shipping.processingTitle", "Order Processing")}</h2>
          <p>{t("shipping.processingText", "Orders are processed on business days (Monday–Friday, 9am–6pm EAT). Orders placed after 4pm or on weekends will be processed the next business day.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("shipping.trackingTitle", "Tracking Your Order")}</h2>
          <p>
            {t("shipping.trackingText", "Once your order is shipped, you can track it in your account under My Orders.")}{" "}
            <Link to="/orders" style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t("nav.orders", "My Orders")}
            </Link>
          </p>
        </div>

        <div className="info-section">
          <h2>{t("shipping.failedTitle", "Failed Delivery")}</h2>
          <p>{t("shipping.failedText", "If delivery fails due to an incorrect address or no one being available to receive the package, our delivery team will attempt redelivery. After two failed attempts, the order will be returned and a refund issued minus delivery costs.")}</p>
        </div>

        <div className="info-section">
          <h2>{t("contact.title", "Contact")}</h2>
          <p>
            {t("contact.lead", "For questions, contact us via")}{" "}
            <Link to="/contact" style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t("contact.title", "Contact Us")}
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfoPage;