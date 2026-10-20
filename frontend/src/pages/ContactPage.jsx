import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/infopage.css";

const ContactPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.warning(t("contact.fillRequired", "Please fill in all required fields."));
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/messages/contact", {
        name: name.trim(),
        email: email.trim(),
        subject: (subject || "General Inquiry").trim(),
        message: message.trim(),
      });
      toast.success(t("contact.success", "Thank you! Your message has been received. We will get back to you soon."));
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err.response?.data?.message || t("contact.error", "Failed to send message. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>{t("contact.title", "Contact Us")}</h1>
        <p className="info-lead">
          {t("contact.lead", "We're here to help. Reach out through any of the channels below.")}
        </p>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-icon">📞</div>
            <h3>{t("contact.phoneTitle", "Phone")}</h3>
            <p>+251 931 597 986</p>
            <p className="contact-note">{t("contact.phoneHours", "Mon–Sat, 9am–6pm EAT")}</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon">✉️</div>
            <h3>{t("contact.emailTitle", "Email")}</h3>
            <p>obsatesfaye6370@gmail.com</p>
            <p className="contact-note">{t("contact.emailNote", "We respond within 24 hours")}</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon">📍</div>
            <h3>{t("contact.locationTitle", "Location")}</h3>
            <p>{t("contact.locationCity", "Ayer Tena, Addis Ababa")}</p>
            <p className="contact-note">{t("contact.locationCountry", "Ethiopia")}</p>
          </div>
        </div>

        <div className="info-section">
          <h2>{t("contact.sendMessageTitle", "Send a Message")}</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>{t("contact.yourName", "Your Name")}</label>
                <input
                  type="text"
                  placeholder="Abebe Merga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("contact.email", "Email")}</label>
                <input
                  type="email"
                  placeholder="abebe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>{t("contact.subject", "Subject")}</label>
              <input
                type="text"
                placeholder={t("contact.subjectPlaceholder", "Order inquiry, product question...")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("contact.message", "Message")}</label>
              <textarea
                rows={5}
                placeholder={t("contact.messagePlaceholder", "Tell us how we can help you...")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="info-btn" disabled={submitting}>
              {submitting ? t("contact.sending", "Sending...") : t("contact.sendBtn", "Send Message")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;