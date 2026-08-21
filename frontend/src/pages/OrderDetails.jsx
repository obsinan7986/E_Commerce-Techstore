import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaUpload, FaClock, FaTimesCircle, FaCheckCircle } from "react-icons/fa";
import { getOrderById }                    from "../services/orderService";
import { initializeChapaPayment,
         uploadPaymentScreenshot,
         getPaymentSettings }              from "../services/paymentService";
import { useAuth }                         from "../context/AuthContext";
import "../styles/orderDetails.css";
import { BASE_URL } from "../services/api";


const STEPS          = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

const pillClass = (s) => `details-status-pill pill-${(s || "pending").toLowerCase()}`;
const payClass  = (s) => ({ Paid: "pay-paid", Failed: "pay-failed", Pending: "pay-pending" }[s] || "");

/* ── Verification status banner config ─────────────────────────── */
const VERIFY_CONFIG = {
  Pending: {
    bg:    "#FEF3C7",
    color: "#92400E",
    icon:  <FaClock />,
    title: "Waiting for Payment Verification",
    body:  "Your screenshot has been received. Our team will verify your payment within 1–24 hours and confirm your order.",
  },
  Verified: {
    bg:    "#DCFCE7",
    color: "#166534",
    icon:  <FaCheckCircle />,
    title: "Payment Verified",
    body:  "Your payment has been confirmed. Your order is now being processed.",
  },
  Rejected: {
    bg:    "#FEE2E2",
    color: "#991B1B",
    icon:  <FaTimesCircle />,
    title: "Payment Rejected",
    body:  "Your payment could not be verified. Please re-upload a clear screenshot of your transfer.",
  },
};

/* ─────────────────────────────────────────────────────────────── */

const OrderDetails = () => {
  const { id }         = useParams();
  const [searchParams] = useSearchParams();
  const { user }       = useAuth();
  const fileRef        = useRef(null);

  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [paying,     setPaying]     = useState(false);
  const [qrSettings, setQrSettings] = useState(null);

  /* Screenshot upload */
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState({ type: "", text: "" });
  const [justUploaded, setJustUploaded] = useState(false);

  /* Auto-open upload panel when redirected from checkout */
  const [showUpload, setShowUpload] = useState(searchParams.get("upload") === "1");

  const reload = () => {
    setLoading(true);
    getOrderById(id)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.response?.data?.message || "Unable to load order."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);      // eslint-disable-line
  useEffect(() => {
    getPaymentSettings()
      .then((d) => setQrSettings(d.settings))
      .catch(() => {});
  }, []);

  /* ── Chapa pay now ──────────────────────────────────────────── */
  const handlePayNow = async () => {
    try {
      setPaying(true);
      const parts   = (user?.fullName || "Customer").trim().split(" ");
      const payment = await initializeChapaPayment({
        orderId:   order._id,
        firstName: parts[0] || "Customer",
        lastName:  parts.slice(1).join(" ") || parts[0] || "Customer",
        email:     user?.email || "",
        phone:     user?.phone || order.shippingAddress?.phone || "",
      });
      if (!payment.success || !payment.checkoutUrl)
        throw new Error(payment.message || "Unable to start payment.");
      window.location.href = payment.checkoutUrl;
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Unable to start payment.");
    } finally {
      setPaying(false);
    }
  };

  /* ── Screenshot upload ──────────────────────────────────────── */
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadMsg({ type: "", text: "" });
    setJustUploaded(false);
  };

  const handleScreenshotUpload = async () => {
    if (!file) {
      setUploadMsg({ type: "error", text: "Please choose a screenshot first." });
      return;
    }
    try {
      setUploading(true);
      setUploadMsg({ type: "", text: "" });
      await uploadPaymentScreenshot(order._id, file);
      setFile(null);
      setPreview("");
      if (fileRef.current) fileRef.current.value = "";
      setJustUploaded(true);
      setShowUpload(false);
      reload();
    } catch (err) {
      setUploadMsg({ type: "error", text: err.response?.data?.message || "Upload failed. Try again." });
    } finally {
      setUploading(false);
    }
  };

  /* ── Loading / error states ─────────────────────────────────── */
  if (loading) return (
    <div className="order-details-page">
      <div className="order-details-loading ts-loading">Loading order…</div>
    </div>
  );
  if (error) return (
    <div className="order-details-page">
      <div className="ts-error">
        <p>{error}</p>
        <Link to="/orders" className="btn-primary" style={{ marginTop: 12 }}>Back to Orders</Link>
      </div>
    </div>
  );
  if (!order) return null;

  /* ── Derived state ──────────────────────────────────────────── */
  const isManual    = MANUAL_METHODS.includes(order.paymentMethod);
  const canPayNow   = order.paymentMethod === "Chapa"
                      && order.paymentStatus !== "Paid"
                      && order.orderStatus   !== "Cancelled";
  const canUpload   = isManual
                      && order.paymentStatus !== "Paid"
                      && order.orderStatus   !== "Cancelled";
  const verStatus   = order.manualPayment?.verificationStatus || "None";
  const isCancelled = order.orderStatus === "Cancelled";
  const currentIdx  = STEPS.indexOf(order.orderStatus);
  const verifyCfg   = VERIFY_CONFIG[verStatus];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="order-details-page">
      <Link to="/orders" className="details-back">
        <FaArrowLeft size={12} /> Back to Orders
      </Link>

      {/* ── Title row ── */}
      <div className="details-title-row">
        <div>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p>Placed {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {canPayNow && (
            <button className="pay-now-btn" onClick={handlePayNow} disabled={paying}>
              {paying ? "Redirecting…" : "💳 Pay Now"}
            </button>
          )}
          {canUpload && (
            <button
              className="pay-now-btn"
              style={{ background: "#0EA5E9" }}
              onClick={() => { setShowUpload((p) => !p); setJustUploaded(false); }}
            >
              <FaUpload size={13} />
              {order.manualPayment?.screenshotUrl ? " Re-upload Receipt" : " Upload Receipt"}
            </button>
          )}
          <span className={pillClass(order.orderStatus)}>{order.orderStatus}</span>
        </div>
      </div>

      {/* ── Verification status banner ── */}
      {verifyCfg && (
        <div className="mp-verify-banner" style={{ background: verifyCfg.bg, color: verifyCfg.color }}>
          <div className="mp-verify-banner-icon">{verifyCfg.icon}</div>
          <div className="mp-verify-banner-text">
            <strong>{verifyCfg.title}</strong>
            <span>{verifyCfg.body}</span>
            {verStatus === "Rejected" && order.manualPayment?.adminNote && (
              <em className="mp-verify-admin-note">Admin: {order.manualPayment.adminNote}</em>
            )}
          </div>
        </div>
      )}

      {/* ── Just-uploaded confirmation ── */}
      {justUploaded && (
        <div className="mp-just-uploaded">
          <FaCheckCircle size={18} />
          <div>
            <strong>Screenshot submitted!</strong>
            <span>We'll verify your payment within 1–24 hours. You'll see the status update on this page.</span>
          </div>
        </div>
      )}

      {/* ── Screenshot upload panel ── */}
      {showUpload && canUpload && (
        <div className="mp-upload-panel">
          <h3><FaUpload size={14} /> Upload Payment Screenshot</h3>
          <p>
            After paying via <strong>{order.paymentMethod}</strong>, upload a clear screenshot
            of the successful transaction below.
          </p>

          {/* QR code reminder */}
          {qrSettings?.bankQrCode && (
            <div className="mp-qr-reminder">
              <img
                src={`${BASE_URL}${qrSettings.bankQrCode}`}
                alt="Bank QR"
                className="mp-qr-small"
              />
              <div>
                {qrSettings.bankName      && <p><strong>{qrSettings.bankName}</strong></p>}
                {qrSettings.accountName   && <p>Account: {qrSettings.accountName}</p>}
                {qrSettings.accountNumber && <p>Number: {qrSettings.accountNumber}</p>}
              </div>
            </div>
          )}

          <div className="mp-file-area">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              id="mp-file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label htmlFor="mp-file" className="mp-file-label">
              {preview
                ? <img src={preview} alt="Preview" className="mp-preview" />
                : <span>📷 Click to choose screenshot</span>
              }
            </label>
          </div>

          {uploadMsg.text && (
            <div className={`mp-upload-msg mp-upload-msg--${uploadMsg.type}`}>
              {uploadMsg.text}
            </div>
          )}

          <div className="mp-upload-actions">
            <button
              className="mp-submit-btn"
              onClick={handleScreenshotUpload}
              disabled={uploading || !file}
            >
              {uploading ? "Uploading…" : "Submit Screenshot"}
            </button>
            <button
              className="mp-cancel-btn"
              onClick={() => { setShowUpload(false); setFile(null); setPreview(""); }}
            >
              Cancel
            </button>
          </div>

          {/* Existing screenshot */}
          {order.manualPayment?.screenshotUrl && (
            <div className="mp-existing">
              <p>Previously submitted:</p>
              <a
                href={`${BASE_URL}${order.manualPayment.screenshotUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={`${BASE_URL}${order.manualPayment.screenshotUrl}`}
                  alt="Submitted"
                  className="mp-preview"
                />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      {!isCancelled ? (
        <div className="order-timeline">
          {STEPS.map((step, i) => {
            const done   = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div
                key={step}
                className={`timeline-step${done ? " done" : ""}${active ? " active" : ""}`}
              >
                <div className="timeline-dot">
                  {done && <FaCheck size={10} />}
                </div>
                <span className="timeline-label">
                  {step === "Pending" ? "Order Placed" : step}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="order-timeline">
          <div className="timeline-step cancelled">
            <div className="timeline-dot">✕</div>
            <span className="timeline-label">Order Cancelled</span>
          </div>
        </div>
      )}

      {/* ── Detail grid ── */}
      <div className="details-grid">
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Order items */}
          <div className="details-card">
            <div className="details-card-header"><h2>Order Items</h2></div>
            <div className="details-card-body">
              {order.orderItems?.map((item, i) => (
                <div className="details-item" key={i}>
                  <img
                    src={item.image?.startsWith("http") ? item.image : `${BASE_URL}${item.image}`}
                    alt={item.name}
                    onError={(e) => { e.target.src = "/placeholder.png"; }}
                  />
                  <div className="details-item-info">
                    <h3>{item.name}</h3>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <span className="details-item-price">
                    ETB {Number(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="details-card">
            <div className="details-card-header"><h2>Shipping Address</h2></div>
            <div className="details-card-body address">
              <strong>{order.shippingAddress?.fullName}</strong>
              <p><span>Phone</span>   <span>{order.shippingAddress?.phone}</span></p>
              <p><span>Address</span> <span>{order.shippingAddress?.address}</span></p>
              {order.shippingAddress?.subCity && (
                <p><span>Sub-city</span><span>{order.shippingAddress.subCity}</span></p>
              )}
              <p><span>City</span><span>{order.shippingAddress?.city}</span></p>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Payment */}
          <div className="details-card">
            <div className="details-card-header"><h2>Payment</h2></div>
            <div className="details-card-body payment-info">
              <p><span>Method</span>
                 <strong>{order.paymentMethod}</strong></p>
              <p><span>Status</span>
                 <strong className={payClass(order.paymentStatus)}>{order.paymentStatus}</strong></p>
              {order.paidAt && (
                <p><span>Paid at</span>
                   <strong>{new Date(order.paidAt).toLocaleString()}</strong></p>
              )}
              {order.paymentResult?.txRef && (
                <p><span>TxRef</span>
                   <strong style={{ fontSize: 12, wordBreak: "break-all" }}>
                     {order.paymentResult.txRef}
                   </strong></p>
              )}
              {isManual && verStatus !== "None" && (
                <p><span>Verification</span>
                   <strong>{verStatus}</strong></p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="details-card">
            <div className="details-card-header"><h2>Order Summary</h2></div>
            <div className="details-card-body">
              <div className="details-summary-row">
                <span>Subtotal</span>
                <span>ETB {Number(order.itemsPrice).toLocaleString()}</span>
              </div>
              <div className="details-summary-row">
                <span>Shipping</span>
                <span>{order.shippingPrice === 0 ? "Free" : `ETB ${Number(order.shippingPrice).toLocaleString()}`}</span>
              </div>
              <div className="details-summary-row">
                <span>Tax (15%)</span>
                <span>ETB {Number(order.taxPrice).toLocaleString()}</span>
              </div>
              <div className="details-summary-total">
                <span>Total</span>
                <span>ETB {Number(order.totalPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
