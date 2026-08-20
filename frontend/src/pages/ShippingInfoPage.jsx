import "../styles/infopage.css";

const ShippingInfoPage = () => (
  <div className="info-page">
    <div className="info-container info-container--narrow">
      <h1>Shipping Information</h1>
      <p className="info-meta">Last updated: January 2026</p>

      <div className="info-section">
        <h2>Delivery Areas</h2>
        <p>OICT_TechStore currently delivers across Ethiopia. Delivery availability and timelines vary by location.</p>
      </div>

      <div className="info-section">
        <h2>Delivery Times</h2>
        <table className="info-table">
          <thead>
            <tr><th>Location</th><th>Standard Delivery</th></tr>
          </thead>
          <tbody>
            <tr><td>Addis Ababa</td><td>1–3 business days</td></tr>
            <tr><td>Major cities (Dire Dawa, Hawassa, Bahir Dar, Ambo, Jimma, Wollega)</td><td>3–5 business days</td></tr>
            <tr><td>Other regions</td><td>5–10 business days</td></tr>
          </tbody>
        </table>
      </div>

      <div className="info-section">
        <h2>Shipping Fees</h2>
        <p>Orders over <strong>ETB 5,000</strong> qualify for <strong>free standard delivery</strong> within Addis Ababa.</p>
        <p>For orders below this threshold, a flat shipping fee of <strong>ETB 200</strong> applies within Addis Ababa. 
        Rates for other regions are calculated at checkout.</p>
      </div>

      <div className="info-section">
        <h2>Order Processing</h2>
        <p>Orders are processed on business days (Monday–Friday, 9am–6pm EAT). Orders placed after 4pm or on weekends will be processed the next business day.</p>
      </div>

      <div className="info-section">
        <h2>Tracking Your Order</h2>
        <p>Once your order is shipped, you can track it in your account under <a href="/orders" style={{ color: "var(--primary)", fontWeight: 600 }}>My Orders</a>. 
        You will also receive status updates.</p>
      </div>

      <div className="info-section">
        <h2>Failed Delivery</h2>
        <p>If delivery fails due to an incorrect address or no one being available to receive the package, our delivery team will attempt redelivery. After two failed attempts, the order will be returned and a refund issued minus delivery costs.</p>
      </div>

      <div className="info-section">
        <h2>Contact</h2>
        <p>For shipping questions: <a href="mailto:support@techstore.et" style={{ color: "var(--primary)" }}>support@techstore.et</a> or <a href="/contact" style={{ color: "var(--primary)" }}>Contact Us</a>.</p>
      </div>
    </div>
  </div>
);

export default ShippingInfoPage;
