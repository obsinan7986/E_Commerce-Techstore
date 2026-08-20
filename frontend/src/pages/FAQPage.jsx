import { useState } from "react";
import "../styles/infopage.css";

const FAQS = [
  { q: "How long does delivery take?", a: "Standard delivery within Addis Ababa takes 1–3 business days. Outside Addis Ababa may take 3–7 business days depending on your location." },
  { q: "What payment methods do you accept?", a: "We accept Chapa, CBE Birr, Telebirr, M-Pesa, Awash Bank, and Cash on Delivery. Online payment options are subject to network availability." },
  { q: "Can I return a product?", a: "Yes. Products can be returned within 14 days of delivery if they are unused, in original packaging, and accompanied by proof of purchase. See our Returns Policy for full details." },
  { q: "How do I track my order?", a: "Log in to your account and visit My Orders. You will see the current status of each order. You will also receive updates by email." },
  { q: "Is my payment information secure?", a: "Yes. All online payments are processed through PCI-compliant payment gateways. TechStore never stores your card information." },
  { q: "What if I receive a damaged product?", a: "Contact us within 48 hours of receiving the product at support@techstore.et with photos of the damage. We will arrange a replacement or refund." },
  { q: "Do you offer warranty on products?", a: "All products carry the manufacturer's standard warranty. The warranty period varies by product and brand." },
  { q: "How do I cancel an order?", a: "Orders can be cancelled before they are shipped. Log in, go to My Orders, and use the Cancel button. Once shipped, cancellation is not possible." },
];

const FAQPage = () => {
  const [open, setOpen] = useState(null);

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>Frequently Asked Questions</h1>
        <p className="info-lead">Find answers to the most common questions about OICT_TechStore.</p>

        <div className="faq-list">
          {FAQS.map((item, i) => (
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
          <p>Still have questions? <a href="/contact" style={{ color: "var(--primary)", fontWeight: 700 }}>Contact us</a></p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
