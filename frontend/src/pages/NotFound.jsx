import { Link } from "react-router-dom";

const NotFound = () => (
  <div style={{
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center",
    background: "#f8fafc",
  }}>
    <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>404</div>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
      Page not found
    </h1>
    <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 28, maxWidth: 360, lineHeight: 1.6 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "13px 28px",
      background: "#2563eb",
      color: "#fff",
      borderRadius: 9,
      fontWeight: 700,
      fontSize: 15,
      textDecoration: "none",
      boxShadow: "0 2px 10px rgba(37,99,235,.28)",
      transition: "background 0.15s",
    }}>
      Back to Home
    </Link>
  </div>
);

export default NotFound;
