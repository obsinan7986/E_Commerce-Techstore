import { createPortal } from "react-dom";

const ConfirmDialog = ({
  open,
  title = "Confirm action",
  message = "This action cannot be undone.",
  productName,
  productImage,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return createPortal(
    <div
      className="admin-modal-overlay"
      onClick={loading ? undefined : onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="admin-modal admin-modal-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3
          id="confirm-dialog-title"
          style={{
            margin: "0 0 12px",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {title}
        </h3>

        {(productName || productImage) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            {productImage && (
              <img
                src={productImage}
                alt={productName || "Product"}
                style={{
                  width: "52px",
                  height: "52px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  flexShrink: 0,
                }}
              />
            )}
            {productName && (
              <div style={{ minWidth: 0 }}>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {productName}
                </strong>
              </div>
            )}
          </div>
        )}

        <p
          style={{
            margin: "0 0 20px",
            fontSize: "0.92rem",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div
          className="admin-modal-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#475569",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: variant === "danger" ? "#ef4444" : "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
