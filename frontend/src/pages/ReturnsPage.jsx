import "../styles/infopage.css";

const ReturnsPage = () => (
  <div className="info-page">
    <div className="info-container info-container--narrow">
      <h1>Returns &amp; Refund Policy</h1>
      <p className="info-meta">Last updated: January 2026</p>

      <div className="info-section">
        <h2>Return Window</h2>
        <p>You may return eligible products within <strong>14 days</strong> of the delivery date.</p>
      </div>

      <div className="info-section">
        <h2>Eligibility</h2>
        <p>To be eligible for a return, the product must be:</p>
        <ul>
          <li>Unused and in original condition</li>
          <li>In the original packaging with all accessories</li>
          <li>Accompanied by the original receipt or order confirmation</li>
        </ul>
        <p>The following items are <strong>not eligible for return</strong>: software (once opened), digital downloads, perishable goods, and items marked as non-returnable.</p>
      </div>

      <div className="info-section">
        <h2>How to Initiate a Return</h2>
        <ol>
          <li>Contact us at <a href="mailto:support@techstore.et">support@techstore.et</a> with your order number and reason for return.</li>
          <li>Our team will respond within 1–2 business days with return instructions.</li>
          <li>Ship the item to our return address using a trackable shipping method.</li>
          <li>Once received and inspected, we will process your refund within 5–7 business days.</li>
        </ol>
      </div>

      <div className="info-section">
        <h2>Refunds</h2>
        <p>Approved refunds are credited to the original payment method. Chapa payments are refunded to the original account. Cash on Delivery refunds are processed via bank transfer.</p>
      </div>

      <div className="info-section">
        <h2>Damaged or Defective Items</h2>
        <p>If you received a damaged or defective item, contact us within <strong>48 hours</strong> of delivery with photos. We will arrange a replacement or full refund at no cost to you.</p>
      </div>
    </div>
  </div>
);

export default ReturnsPage;
