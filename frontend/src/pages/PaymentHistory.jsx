/**
 * User Payment History Page
 * Shows all orders with manual payment methods + their screenshot / verification status.
 * Accessible at /payment-history (protected route).
 */
import { useEffect, useRef, useState } from "react";
import { Link }                         from "react-router-dom";
import { getMyOrders }                  from "../services/orderService";
import { uploadPaymentScreenshot,
         getPaymentSettings }           from "../services/paymentService";
import "../styles/paymentHistory.css";

const BASE           = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

const VERIFY_CFG = {
  None:     { cls: "ph-badge--none",     label: "No Screenshot"          },
  Pending:  { cls: "ph-badge--pending",  label: "⏳ Pending Verification" },
  Verified: { cls: "ph-badge--verified", label: "✓ Verified"             },
  Rejected: { cls: "ph-badge--rejected", label: "✕ Rejected"             },
};

const PAY_CFG = {
  Pending: { cls: "ph-pay--pending", label: "Pending"  },
  Paid:    { cls: "ph-pay--paid",    label: "Paid"     },
  Failed:  { cls: "ph-pay--failed",  label: "Failed"   },
};

/* ── Upload panel per-order ── */
const UploadPanel = ({ order, onDone }) => {
  const fileRef    = useRef(null);
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async () => {
    if (!file) { setMsg({ type: "error", text: "Choose a screenshot first." }); return; }
    try {
      setLoading(true);
      await uploadPaymentScreenshot(order._id, file);
      setMsg({ type: "success", text: "Uploaded! Admin will verify within 1–24 hours." });
      setFile(null);
      setPreview("");
      if (fileRef.current) fileRef.current.value = "";
      onDone();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ph-upload-panel">
      <input ref={fileRef} type="file" accept="image/*" id={`up-${order._id}`}
        style={{ display: "none" }} onChange={handleFile} />
      <label htmlFor={`up-${order._id}`} className="ph-file-label">
        {preview
          ? <img src={preview} alt="preview" className="ph-preview-img" />
          : <span>📷 Choose screenshot</span>
        }
      </label>
      {msg.text && (
        <div className={`ph-upload-msg ph-upload-msg--${msg.type}`}>{msg.text}</div>
      )}
      <button className="ph-upload-btn" onClick={handleSubmit} disabled={loading || !file}>
        {loading ? "Uploading…" : "Submit Screenshot"}
      </button>
    </div>
  );
};

/* ── Image preview modal ── */
const ImgModal = ({ src, onClose }) => {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="ph-modal-bg" onClick={onClose}>
      <div className="ph-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="ph-modal-close" onClick={onClose}>✕</button>
        <img src={src} alt="screenshot" className="ph-modal-img" />
      </div>
    </div>
  );
};

/* ── Main Page ── */
const PaymentHistory = () => {
  const [allOrders,   setAllOrders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [qrSettings,  setQrSettings]  = useState(null);
  const [openUpload,  setOpenUpload]  = useState(null);  // orderId
  const [modalSrc,    setModalSrc]    = useState(null);
  const [filter,      setFilter]      = useState("all"); // all | pending | verified | rejected

  const load = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      // Only keep manual-method orders
      const manual = (data.orders || []).filter((o) =>
        MANUAL_METHODS.includes(o.paymentMethod)
      );
      setAllOrders(manual);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getPaymentSettings()
      .then((d) => setQrSettings(d.settings))
      .catch(() => {});
  }, []);

  const filtered = allOrders.filter((o) => {
    if (filter === "all") return true;
    const vs = (o.manualPayment?.verificationStatus || "None").toLowerCase();
    return vs === filter;
  });

  const canUpload = (o) =>
    o.paymentStatus !== "Paid" && o.orderStatus !== "Cancelled";

  if (loading) return (
    <div className="ph-page"><div className="ph-loading">Loading payment history…</div></div>
  );
  if (error) return (
    <div className="ph-page"><div className="ph-error">{error}</div></div>
  );

  return (
    <div className="ph-page">
      <div className="ph-header">
        <div>
          <h1>Payment History</h1>
          <p>View your manual payment submissions and verification status</p>
        </div>
        <Link to="/orders" className="ph-back-link">← All Orders</Link>
      </div>

      {/* Bank accounts reminder */}
      {qrSettings && (
        <div className="ph-bank-reminder">
          <div className="ph-bank-reminder-title">💳 Payment Accounts</div>
          <div className="ph-bank-reminder-accounts">
            {qrSettings.bankAccounts?.map((acc, i) => (
              <div className="ph-bank-reminder-item" key={i}>
                {qrSettings.bankQrCode && i === 0 && (
                  <img
                    src={`${BASE}${qrSettings.bankQrCode}`}
                    alt="QR"
                    className="ph-bank-qr"
                  />
                )}
                <div>
                  <span className="ph-bank-name">{acc.bankName}</span>
                  {acc.accountName   && <span>Account: {acc.accountName}</span>}
                  {acc.accountNumber && (
                    <span className="ph-bank-num">
                      {acc.accountNumber}
                      <button
                        className="ph-copy-btn"
                        onClick={() => navigator.clipboard.writeText(acc.accountNumber)}
                        title="Copy"
                      >
                        📋
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* Fallback legacy single account */}
            {!qrSettings.bankAccounts?.length && qrSettings.accountNumber && (
              <div className="ph-bank-reminder-item">
                {qrSettings.bankQrCode && (
                  <img src={`${BASE}${qrSettings.bankQrCode}`} alt="QR" className="ph-bank-qr" />
                )}
                <div>
                  {qrSettings.bankName      && <span className="ph-bank-name">{qrSettings.bankName}</span>}
                  {qrSettings.accountName   && <span>Account: {qrSettings.accountName}</span>}
                  {qrSettings.accountNumber && <span className="ph-bank-num">{qrSettings.accountNumber}</span>}
                </div>
              </div>
            )}
          </div>
          {qrSettings.instructions && (
            <p className="ph-bank-instructions">{qrSettings.instructions}</p>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="ph-filter-tabs">
        {[
          { key: "all",      label: `All (${allOrders.length})` },
          { key: "none",     label: "No Screenshot" },
          { key: "pending",  label: "Pending" },
          { key: "verified", label: "Verified" },
          { key: "rejected", label: "Rejected" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`ph-filter-tab${filter === key ? " ph-filter-tab--active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ph-empty">
          <span>💳</span>
          <p>No {filter === "all" ? "" : filter} manual payment orders found.</p>
          <Link to="/checkout" className="ph-shop-link">Place an Order</Link>
        </div>
      ) : (
        <div className="ph-list">
          {filtered.map((order) => {
            const mp     = order.manualPayment || {};
            const vs     = mp.verificationStatus || "None";
            const vcfg   = VERIFY_CFG[vs] || VERIFY_CFG.None;
            const pcfg   = PAY_CFG[order.paymentStatus] || PAY_CFG.Pending;
            const scrFull = mp.screenshotUrl ? `${BASE}${mp.screenshotUrl}` : null;

            return (
              <div className="ph-card" key={order._id}>
                {/* Header */}
                <div className="ph-card-header">
                  <div className="ph-card-ids">
                    <span className="ph-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="ph-method-tag">{order.paymentMethod}</span>
                  </div>
                  <div className="ph-card-badges">
                    <span className={`ph-badge ${vcfg.cls}`}>{vcfg.label}</span>
                    <span className={`ph-pay-badge ${pcfg.cls}`}>{pcfg.label}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="ph-card-body">
                  <div className="ph-card-meta">
                    <div className="ph-meta-item">
                      <span className="ph-meta-label">Order Date</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </div>
                    <div className="ph-meta-item">
                      <span className="ph-meta-label">Amount</span>
                      <span className="ph-amount">ETB {Number(order.totalPrice).toLocaleString()}</span>
                    </div>
                    <div className="ph-meta-item">
                      <span className="ph-meta-label">Order Status</span>
                      <span>{order.orderStatus}</span>
                    </div>
                    {mp.uploadedAt && (
                      <div className="ph-meta-item">
                        <span className="ph-meta-label">Screenshot Uploaded</span>
                        <span>{new Date(mp.uploadedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    )}
                  </div>

                  {/* Rejection note */}
                  {vs === "Rejected" && mp.adminNote && (
                    <div className="ph-rejection-note">
                      <strong>Admin note:</strong> {mp.adminNote}
                    </div>
                  )}

                  {/* Screenshot display */}
                  {scrFull && (
                    <div className="ph-screenshot-row">
                      <span className="ph-meta-label">Submitted Screenshot</span>
                      <div className="ph-screenshot-wrap">
                        <img
                          src={scrFull}
                          alt="Payment screenshot"
                          className="ph-screenshot-thumb"
                          onClick={() => setModalSrc(scrFull)}
                        />
                        <button className="ph-view-btn" onClick={() => setModalSrc(scrFull)}>
                          🔍 View Full
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload / re-upload panel */}
                  {canUpload(order) && (
                    <div className="ph-upload-section">
                      <button
                        className="ph-toggle-upload-btn"
                        onClick={() => setOpenUpload((p) => p === order._id ? null : order._id)}
                      >
                        {scrFull ? "🔄 Re-upload Screenshot" : "📤 Upload Payment Screenshot"}
                      </button>
                      {openUpload === order._id && (
                        <UploadPanel
                          order={order}
                          onDone={() => { setOpenUpload(null); load(); }}
                        />
                      )}
                    </div>
                  )}

                  {/* Link to order details */}
                  <Link to={`/orders/${order._id}`} className="ph-details-link">
                    View Order Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image modal */}
      {modalSrc && <ImgModal src={modalSrc} onClose={() => setModalSrc(null)} />}
    </div>
  );
};

export default PaymentHistory;
