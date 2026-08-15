import "../styles/infopage.css";

const ContactPage = () => (
  <div className="info-page">
    <div className="info-container">
      <h1>Contact Us</h1>
      <p className="info-lead">We're here to help. Reach out through any of the channels below.</p>

      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <h3>Phone</h3>
          <p>+251 931 597 986</p>
          <p className="contact-note">Mon–Sat, 9am–6pm EAT</p>
        </div>
        <div className="contact-card">
          <div className="contact-icon">✉️</div>
          <h3>Email</h3>
          <p>obsatesfaye6370@gmail.com</p>
          <p className="contact-note">We respond within 24 hours</p>
        </div>
        <div className="contact-card">
          <div className="contact-icon">📍</div>
          <h3>Location</h3>
          <p>Ayer Tena, Addis Ababa</p>
          <p className="contact-note">Ethiopia</p>
        </div>
      </div>

      <div className="info-section">
        <h2>Send a Message</h2>
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Thank you! We will get back to you soon."); }}>
          <div className="form-row">
            <div className="form-group"><label>Your Name</label><input type="text" placeholder="Abebe Merga" required /></div>
            <div className="form-group"><label>Email</label><input type="email" placeholder="abebe@example.com" required /></div>
          </div>
          <div className="form-group"><label>Subject</label><input type="text" placeholder="Order inquiry, product question..." required /></div>
          <div className="form-group">
            <label>Message</label>
            <textarea rows={5} placeholder="Tell us how we can help you..." required />
          </div>
          <button type="submit" className="info-btn">Send Message</button>
        </form>
      </div>
    </div>
  </div>
);

export default ContactPage;
