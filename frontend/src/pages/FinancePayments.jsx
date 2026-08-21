/**
 * Finance — Payment Management  /finance/payments
 * Full payment list with filters, verification for manual payments,
 * order detail modal, and refund marking.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getFinancePayments,
  getFinanceOrderDetail,
  financeVerifyPayment,
  financeMarkRefund,
} from "../services/adminservice";
import { BASE_URL } from "../services/api";
import "../styles/financePayments.css";

const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const payStatusCls = (s) => ({
  Paid:     "fp-badge fp-badge--paid",
  Pending:  "fp-badge fp-badge--pending",
  Failed:   "fp-badge fp-badge--failed",
  Refunded: "fp-badge fp-badge--refunded",
}[s] || "fp-badge");

const manualCls = (s) => ({
  Verified: "fp-badge fp-badge--paid",
  Pending:  "fp-badge fp-badge--pending",
  Rejected: "fp-badge fp-badge--failed",
  None:     "",
}[s] || "");

const FinancePayments = () => {
  const [searchParams] = useSearchParams();

  const [payments,  setPayments]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [msg,       setMsg]       = useState({ type: "", text: "" });

  // Filters
  const [keyword,        setKeyword]       = useState("");
  const [paymentStatus,  setPaymentStatus] = useState(searchParams.get("paymentStatus") || "");
  const [paymentMethod,  setPaymentMethod] = useState("");

  // Order detail modal
  const [detailOrder, setDetailOrder]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Verify / reject state
  const [acting,   setActing]   = useState(null); // orderId
  const [notes,    setNotes]    = useState({});

  // Refund state
  const [refunding,     setRefunding]     = useState(null);
  const [refundReason,  setRefundReason]  = useState("");
  const [refundTarget,  setRefundTarget]  = useState(null); // orderId

  // Screenshot preview
  const [previewSrc, setPreviewSrc] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFinancePayments({ page, limit: 15, keyword, paymentStatus, paymentMethod });
      setPayments(res.payments || []);
      setTotal(res.total  || 0);
      setPages(res.pages  || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, paymentStatus, paymentMethod]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const openDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const res = await getFinanceOrderDetail(orderId);
      setDetailOrder(res.order);
    } catch {
      setMsg({ type: "error", text: "Failed to load order detail." });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (orderId, action) => {
    try {
      setActing(orderId);
      setMsg({ type: "", text: "" });
      await financeVerifyPayment(orderId, action, notes[orderId] || "");
      setMsg({ type: "success", text: `Payment ${action === "verify" ? "verified" : "rejected"} successfully.` });
      await load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Action failed." });
    } finally {
      setActing(null);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      setRefunding(refundTarget);
      await financeMarkRefund(refundTarget, refundReason);
      setMsg({ type: "success", text: "Order marked as refunded. Process the actual refund manually through your payment provider." });
      setRefundTarget(null);
      setRefundReason("");
      await load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Refund failed." });
    } finally {
      setRefunding(null);
    }
  };

  const screenshotSrc = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className="fd-page fp-page">

      {/* Header */}
      <div className="fd-header">
        <div>
          <h1>Payment Management</h1>
          <p>View, verify and manage all customer payments</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="fd-refresh-btn" onClick={load}>↻ Refresh</button>
          <Link to="/finance/dashboard" className="fd-refresh-btn">← Dashboard</Link>
        </div>
      </div>

      {/* Filters */}
      <form className="fp-filters" onSubmit={handleSearch}>
        <input className="fp-input" placeholder="Search customer, email, order ID, txRef…"
          value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <select className="fp-select" value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
        <select className="fp-select" value={paymentMethod}
          onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}>
          <option value="">All methods</option>
          <option value="Chapa">Chapa</option>
          {MANUAL_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          <option value="Cash On Delivery">Cash On Delivery</option>
        </select>
        <button type="submit" className="fp-search-btn">Search</button>
        {(keyword || paymentStatus || paymentMethod) && (
          <button type="button" className="fp-clear-btn"
            onClick={() => { setKeyword(""); setPaymentStatus(""); setPaymentMethod(""); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      {msg.text && (
        <div className={`fp-msg fp-msg--${msg.type}`}>
          {msg.text}
          <button onClick={() => setMsg({ type: "", text: "" })}>×</button>
        </div>
      )}

      {error && <div className="fp-msg fp-msg--error">{error}</div>}

      {loading ? (
        <div className="fd-loading">Loading payments…</div>
      ) : payments.length === 0 ? (
        <div className="fp-empty"><span>💳</span><p>No payments found.</p></div>
      ) : (
        <>
          <p className="fp-count">{total} payment{total !== 1 ? "s" : ""}</p>

          <div className="fp-list">
            {payments.map((p) => {
              const isManual   = MANUAL_METHODS.includes(p.paymentMethod);
              const needsVerify = isManual && p.manualStatus === "Pending";
              const ss = screenshotSrc(p.manualScreenshot);

              return (
                <div className="fp-card" key={p.orderId?.toString()}>
                  <div className="fp-card-header">
                    <div className="fp-card-left">
                      <span className="fp-order-id">
                        #{p.orderId?.toString().slice(-8).toUpperCase()}
                      </span>
                      <span className={payStatusCls(p.paymentStatus)}>{p.paymentStatus}</span>
                      {isManual && p.manualStatus !== "None" && (
                        <span className={manualCls(p.manualStatus)}>
                          Manual: {p.manualStatus}
                        </span>
                      )}
                    </div>
                    <div className="fp-card-right">
                      <span className="fp-amount">ETB {fmt(p.amount)}</span>
                      <span className="fp-method-tag">{p.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="fp-card-body">
                    <div className="fp-info-grid">
                      <div><span>Customer</span><strong>{p.customer?.fullName || "—"}</strong></div>
                      <div><span>Email</span><strong>{p.customer?.email || "—"}</strong></div>
                      <div><span>Order Status</span><strong>{p.orderStatus}</strong></div>
                      <div>
                        <span>Date</span>
                        <strong>{new Date(p.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</strong>
                      </div>
                      {p.txRef && <div><span>Tx Ref</span><strong className="fp-mono">{p.txRef}</strong></div>}
                      {p.transactionId && <div><span>Txn ID</span><strong className="fp-mono">{p.transactionId}</strong></div>}
                      {p.paidAt && <div><span>Paid At</span><strong>{new Date(p.paidAt).toLocaleDateString()}</strong></div>}
                    </div>

                    {/* Screenshot for manual payments */}
                    {isManual && ss && (
                      <div className="fp-screenshot">
                        <span>Payment Screenshot:</span>
                        <img src={ss} alt="screenshot" className="fp-screenshot-thumb"
                          onClick={() => setPreviewSrc(ss)}
                          onError={(e) => { e.target.style.display = "none"; }} />
                        <button className="fp-preview-btn" onClick={() => setPreviewSrc(ss)}>
                          🔍 Preview
                        </button>
                      </div>
                    )}
                    {isManual && !ss && p.manualStatus === "Pending" && (
                      <p className="fp-no-screenshot">No screenshot uploaded yet.</p>
                    )}
                    {p.manualNote && (
                      <p className="fp-admin-note"><strong>Note:</strong> {p.manualNote}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="fp-card-actions">
                    <button className="fp-btn fp-btn--detail"
                      onClick={() => openDetail(p.orderId)} disabled={detailLoading}>
                      📋 View Order
                    </button>

                    {/* Manual verify/reject — only if pending */}
                    {needsVerify && (
                      <>
                        <div className="fp-note-wrap">
                          <textarea className="fp-note-input" rows={1}
                            placeholder="Admin note (optional)…"
                            value={notes[p.orderId] || ""}
                            onChange={(e) => setNotes(n => ({ ...n, [p.orderId]: e.target.value }))}
                          />
                        </div>
                        <button className="fp-btn fp-btn--verify"
                          onClick={() => handleVerify(p.orderId, "verify")}
                          disabled={acting === p.orderId}>
                          {acting === p.orderId ? "…" : "✓ Verify"}
                        </button>
                        <button className="fp-btn fp-btn--reject"
                          onClick={() => handleVerify(p.orderId, "reject")}
                          disabled={acting === p.orderId}>
                          {acting === p.orderId ? "…" : "✕ Reject"}
                        </button>
                      </>
                    )}

                    {/* Refund button — only for paid orders */}
                    {p.paymentStatus === "Paid" && (
                      <button className="fp-btn fp-btn--refund"
                        onClick={() => setRefundTarget(p.orderId?.toString())}>
                        ↩ Mark Refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div className="fp-pagination">
              <button disabled={page <= 1}    onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Order Detail Modal ── */}
      {detailOrder && (
        <div className="fp-overlay" onClick={() => setDetailOrder(null)}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fp-modal-header">
              <h2>Order #{detailOrder._id?.toString().slice(-8).toUpperCase()}</h2>
              <button className="fp-modal-close" onClick={() => setDetailOrder(null)}>×</button>
            </div>
            <div className="fp-modal-body">
              {/* Customer */}
              <h3>Customer</h3>
              <div className="fp-detail-grid">
                <div><span>Name</span><strong>{detailOrder.user?.fullName || "—"}</strong></div>
                <div><span>Email</span><strong>{detailOrder.user?.email || "—"}</strong></div>
                <div><span>Phone</span><strong>{detailOrder.user?.phone || "—"}</strong></div>
              </div>
              {/* Payment */}
              <h3>Payment</h3>
              <div className="fp-detail-grid">
                <div><span>Method</span><strong>{detailOrder.paymentMethod}</strong></div>
                <div><span>Status</span><strong><span className={payStatusCls(detailOrder.paymentStatus)}>{detailOrder.paymentStatus}</span></strong></div>
                <div><span>Total</span><strong>ETB {fmt(detailOrder.totalPrice)}</strong></div>
                {detailOrder.paidAt && <div><span>Paid At</span><strong>{new Date(detailOrder.paidAt).toLocaleString()}</strong></div>}
              </div>
              {/* Order items */}
              <h3>Items ({detailOrder.orderItems?.length || 0})</h3>
              <div className="fp-items">
                {(detailOrder.orderItems || []).map((item, i) => (
                  <div key={i} className="fp-item">
                    <strong>{item.name}</strong>
                    <span>× {item.quantity} @ ETB {fmt(item.price)}</span>
                    <span>= ETB {fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Price breakdown */}
              <div className="fp-price-breakdown">
                <div><span>Items</span><span>ETB {fmt(detailOrder.itemsPrice)}</span></div>
                <div><span>Shipping</span><span>ETB {fmt(detailOrder.shippingPrice)}</span></div>
                <div className="fp-total"><span>Total</span><strong>ETB {fmt(detailOrder.totalPrice)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Refund Confirm Modal ── */}
      {refundTarget && (
        <div className="fp-overlay" onClick={() => setRefundTarget(null)}>
          <div className="fp-confirm" onClick={(e) => e.stopPropagation()}>
            <span>↩</span>
            <h3>Mark as Refunded?</h3>
            <p>This updates the order status in the database only.<br />
              <strong>No money is moved automatically.</strong> You must process the actual refund through your payment provider manually.</p>
            <textarea className="fp-note-input" rows={2}
              placeholder="Reason for refund (optional)…"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)} />
            <div className="fp-confirm-actions">
              <button className="fp-btn fp-btn--detail" onClick={() => setRefundTarget(null)}>Cancel</button>
              <button className="fp-btn fp-btn--refund" onClick={handleRefund} disabled={!!refunding}>
                {refunding ? "Processing…" : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Screenshot Preview ── */}
      {previewSrc && (
        <div className="fp-overlay" onClick={() => setPreviewSrc(null)}>
          <div className="fp-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fp-modal-close" onClick={() => setPreviewSrc(null)}>×</button>
            <img src={previewSrc} alt="Payment screenshot" />
            <a href={previewSrc} target="_blank" rel="noreferrer" className="fp-open-link">Open full size ↗</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePayments;
