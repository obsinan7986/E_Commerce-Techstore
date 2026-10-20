import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/infopage.css";

const FAQPage = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  const faqs = [
    { q: t("faq.q1", "How long does delivery take?"), a: t("faq.a1", "Standard delivery within Addis Ababa takes 1–3 business days. Outside Addis Ababa may take 3–7 business days depending on your location.") },
    { q: t("faq.q2", "What payment methods do you accept?"), a: t("faq.a2", "We accept Chapa, CBE Birr, Telebirr, M-Pesa, Awash Bank, and Cash on Delivery. Online payment options are subject to network availability.") },
    { q: t("faq.q3", "Can I return a product?"), a: t("faq.a3", "Yes. Products can be returned within 14 days of delivery if they are unused, in original packaging, and accompanied by proof of purchase. See our Returns Policy for full details.") },
    { q: t("faq.q4", "How do I track my order?"), a: t("faq.a4", "Log in to your account and visit My Orders. You will see the current status of each order. You will also receive updates by email.") },
    { q: t("faq.q5", "Is my payment information secure?"), a: t("faq.a5", "Yes. All online payments are processed through PCI-compliant payment gateways. TechStore never stores your card information.") },
    { q: t("faq.q6", "What if I receive a damaged product?"), a: t("faq.a6", "Contact us within 48 hours of receiving the product with photos of the damage. We will arrange a replacement or refund.") },
    { q: t("faq.q7", "Do you offer warranty on products?"), a: t("faq.a7", "All products carry the manufacturer's standard warranty. The warranty period varies by product and brand.") },
    { q: t("faq.q8", "How do I cancel an order?"), a: t("faq.a8", "Orders can be cancelled before they are shipped. Log in, go to My Orders, and use the Cancel button. Once shipped, cancellation is not possible.") },
  ];

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>{t("faq.title", "Frequently Asked Questions")}</h1>
        <p className="info-lead">{t("faq.lead", "Find answers to the most common questions about OICT_TechStore.")}</p>

        <div className="faq-list">
          {faqs.map((item, i) => (
            <div key={i} className={`faq-item${open === i ? " open" : ""}`}>
              <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className="faq-icon">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="faq-answer">{item.a}</p>}
            </div>
          ))}
        </div>

        <div className="info-section" style={{ textAlign: "center", marginTop: 40 }}>
          <p>
            {t("faq.stillHaveQuestions", "Still have questions?")}{" "}
            <Link to="/contact" style={{ color: "var(--primary)", fontWeight: 700 }}>
              {t("faq.contactUs", "Contact us")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;