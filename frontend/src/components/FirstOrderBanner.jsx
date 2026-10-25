import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { checkFirstOrderDiscount } from "../services/couponService";

const FirstOrderBanner = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    checkFirstOrderDiscount()
      .then((res) => {
        if (res?.eligible && res?.coupon) {
          setData(res.coupon);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null));
  }, [user]);

  if (!user || !data || dismissed) return null;

  const discountText = data.type === "percentage"
    ? `${data.discount}%`
    : `ETB ${Number(data.discount).toLocaleString()}`;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="first-order-banner"
      style={{
        background: "linear-gradient(90deg, #ECFDF5 0%, #EFF6FF 100%)",
        border: "1.5px solid #6EE7B7",
        borderRadius: 12,
        padding: "12px 18px",
        margin: "16px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 20 }}>🎁</span>
        <span style={{ fontSize: 14, color: "#065F46", fontWeight: 600 }}>
          Your first-order gift: code{" "}
          <strong
            style={{
              fontFamily: "monospace",
              background: "#D1FAE5",
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 15,
              color: "#047857",
              letterSpacing: 0.5,
            }}
          >
            {data.code}
          </strong>{" "}
          — {discountText} off
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? "#059669" : "#10B981",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: "none",
            border: "none",
            color: "#6B7280",
            fontSize: 18,
            cursor: "pointer",
            padding: "2px 6px",
            lineHeight: 1,
          }}
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default FirstOrderBanner;
