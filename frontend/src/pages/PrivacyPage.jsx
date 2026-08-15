import "../styles/infopage.css";

const PrivacyPage = () => (
  <div className="info-page">
    <div className="info-container info-container--narrow">
      <h1>Privacy Policy</h1>
      <p className="info-meta">Last updated: January 2026</p>

      <div className="info-section">
        <h2>1. Information We Collect</h2>
        <p>When you create an account or place an order, we collect your name, 
          email address, phone number, shipping address, and payment transaction references. 
          We do not store full card numbers or CVV codes.</p>
      </div>

      <div className="info-section">
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To process and fulfill your orders</li>
          <li>To communicate order status and updates</li>
          <li>To provide customer support</li>
          <li>To improve our products and services</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>3. Information Sharing</h2>
        <p>We do not sell or rent your personal information to third parties. 
          We share data only with service providers necessary to fulfill your order 
          (e.g., payment processors, delivery services), and only to the extent required.</p>
      </div>

      <div className="info-section">
        <h2>4. Data Security</h2>
        <p>We use industry-standard security measures to protect your personal information. 
          Passwords are stored using one-way hashing. Payment processing is handled by trusted third-party gateways.</p>
      </div>

      <div className="info-section">
        <h2>5. Cookies</h2>
        <p>We use cookies and local storage to maintain your session and shopping cart. 
          No advertising or tracking cookies are used.</p>
      </div>

      <div className="info-section">
        <h2>6. Your Rights</h2>
        <p>You may request deletion of your account and associated data 
          by contacting us at obsatesfaye6370@gmail.com.</p>
      </div>

      <div className="info-section">
        <h2>7. Contact</h2>
        <p>For privacy-related questions, contact us at: 
          <a href="mailto:obsatesfaye6370@gmail.com">obsatesfaye6370@gmail.com</a></p>
      </div>
    </div>
  </div>
);

export default PrivacyPage;
