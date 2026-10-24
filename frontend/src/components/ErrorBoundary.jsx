import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "2.5rem 2rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#64748b",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
                lineHeight: "1.5",
              }}
            >
              An unexpected error occurred while loading this page. Please try reloading.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontWeight: "600",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2563eb")}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
