import "../styles/infopage.css";

const TermsPage = () => (
  <div className="info-page">
    <div className="info-container info-container--narrow">
      <h1>Terms &amp; Conditions</h1>
      <p className="info-meta">Last updated: January 2026</p>

      <div className="info-section">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using TechStore, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
      </div>

      <div className="info-section">
        <h2>2. Use of the Platform</h2>
        <p>You agree to use TechStore only for lawful purposes. You must not use the platform to distribute malware, conduct fraud, or harass other users.</p>
      </div>

      <div className="info-section">
        <h2>3. Account Responsibility</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
      </div>

      <div className="info-section">
        <h2>4. Orders and Payments</h2>
        <p>All orders are subject to availability and confirmation. Prices may change without notice. A confirmed order constitutes a binding contract between you and TechStore.</p>
      </div>

      <div className="info-section">
        <h2>5. Product Information</h2>
        <p>We make every effort to display products accurately. However, we cannot guarantee that product images, descriptions, or prices are error-free. We reserve the right to correct errors.</p>
      </div>

      <div className="info-section">
        <h2>6. Limitation of Liability</h2>
        <p>TechStore is not liable for indirect, incidental, or consequential damages arising from the use or inability to use our services.</p>
      </div>

      <div className="info-section">
        <h2>7. Governing Law</h2>
        <p>These terms are governed by the laws of the Federal Democratic Republic of Ethiopia.</p>
      </div>

      <div className="info-section">
        <h2>8. Contact</h2>
        <p>For questions about these terms: <a href="mailto:support@techstore.et">support@techstore.et</a></p>
      </div>
    </div>
  </div>
);

export default TermsPage;
