import { useCallback, useEffect, useState } from "react";
import { Link }                              from "react-router-dom";
import {
  getPendingManualPayments,
  verifyManualPayment,
  getManualPaymentStats,
} from "../services/paymentService";
import "../styles/adminManualPayments.css";

const BASE          = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const STATUS_TABS   = ["Pending", "Verified", "Rejected"];
const METHOD_OPTIONS = ["All", "CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

const badgeClass = (s) => ({
  Pending:  "amp-badge amp-badge--pending",
  Verified: "amp-badge amp-badge--verified",
  Rejected: "amp-badge amp-badge--rejected",
}[s] || "amp-badge");

/* ─────────────────────────────────────────────────────────────────── */
/*  Image Preview Modal                                                */
/* ─────────────────────────────────────────────────────────────────── */
const ImageModal = ({ src, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="amp-modal-backdrop" onClick={onClose}>
      <div className="amp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="amp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <img src={src} alt="Payment screenshot" className="amp-modal-img" />
        <a href={src} target="_blank" rel="noreferrer" className="amp-modal-open-link">
          Open full size ↗
        </a>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Page                                                          */
/* ─────────────────────────────────────────────────────────────────── */
const AdminManualPayments = () => {
  /* ── Tab / filters ── */
  const [tab,      setTab]    = useState("Pending");
  const [search,   setSearch] = useState("");
  const [method,   setMethod] = useState("All");
  const [page,     setPage]   = useState(1);

  /* ── Data ── */
  const [orders,   setOrders]  = useState([]);
  const [pages,    setPages]   = useState(1);
  const [total,    setTotal]   = useState(0);
  const [stats,    setStats]   = useState({ pending: 0, verified: 0, rejected: 0 });
  const [loading,  setLoading] = useState(true);

  /* ── Per-row action ── */
  const [acting,   setActing]  = useState({});
  const [notes,    setNotes]   = useState({});

  /* ── Modal ── */
  const [modalSrc, setModalSrc] = useState(null);

  /* ── Global message ── */
  const [msg, setMsg] = useState({ type: "", text: "" });

  /* ── Load stats (always fresh) ── */
  const loadStats = () =>
    getManualPaymentStats()
      .then((d) => setStats(d.stats || { pending: 0, verified: 0, rejected: 0 }))
      .catch(() => {});

  /* ── Load orders ── */
  const loadOrders = useCallback(() => {
    setLoading(true);
    const params = { status: tab, page, limit: 10 };
    if (method !== "All")       params.method  = method;
    if (search.trim())          params.keyword = search.trim();

    getPendingManualPayments(params)
      .then((d) => {
        setOrders(d.orders  || []);
        setPages( d.pages   || 1);
        setTotal( d.total   || 0);
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load payments." }))
      .finally(() => setLoading(false));
  }, [tab, page, method, search]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  /* ── Handlers ── */
  const handleTabChange = (t) => { setTab(t); setPage(1); };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleAction = async (orderId, action) => {
    try {
      setActing((p) => ({ ...p, [orderId]: action }));
      setMsg({ type: "", text: "" });
      await verifyManualPayment(orderId, action, notes[orderId] || "");
      setMsg({
        type: "success",
        text: `Payment ${action === "verify" ? "verified — order set to Confirmed" : "rejected"}.`,
      });
      loadStats();
      loadOrders();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Action failed." });
    } finally {
      setActing((p) => ({ ...p, [orderId]: null }));
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="amp-page">

      {/* ── Header ── */}
      <div className="amp-header">
        <div>
          <h1>Manual Payment Verification</h1>
          <p>Review customer payment screenshots · CBE Birr · Telebirr · M-Pesa · Awash Bank</p>
        </div>
        <Link to="/admin/payment-settings" className="amp-settings-link">⚙ Payment Settings</Link>
      </div>

      {/* ── Stats cards ── */}
      <div className="amp-stats">
        <div className="amp-stat amp-stat--pending"
          onClick={() => handleTabChange("Pending")}
          style={{ cursor: "pointer" }}>
          <span className="amp-stat-num">{stats.pending}</span>
          <span className="amp-stat-label">⏳ Pending</span>
        </div>
        <div className="amp-stat amp-stat--verified"
          onClick={() => handleTabChange("Verified")}
          style={{ cursor: "pointer" }}>
          <span className="amp-stat-num">{stats.verified}</span>
          <span className="amp-stat-label">✓ Verified</span>
        </div>
        <div className="amp-stat amp-stat--rejected"
          onClick={() => handleTabChange("Rejected")}
          style={{ cursor: "pointer" }}>
          <span className="amp-stat-num">{stats.rejected}</span>
          <span className="amp-stat-label">✕ Rejected</span>
        </div>
        <div className="amp-stat amp-stat--total">
          <span className="amp-stat-num">{stats.pending + stats.verified + stats.rejected}</span>
          <span className="amp-stat-label">Total Manual</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="amp-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            className={`amp-tab${tab === t ? " amp-tab--active" : ""}`}
            onClick={() => handleTabChange(t)}
          >
            {t}
            {t === "Pending" && stats.pending > 0 && (
              <span className="amp-tab-badge">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <form className="amp-filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="amp-search-input"
          placeholder="Search by customer name, email, or order ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="amp-method-select"
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
        >
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>{m === "All" ? "All Methods" : m}</option>
          ))}
        </select>
        <button type="submit" className="amp-search-btn">Search</button>
        {(search || method !== "All") && (
          <button type="button" className="amp-clear-filters-btn"
            onClick={() => { setSearch(""); setMethod("All"); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      {/* ── Global message ── */}
      {msg.text && (
        <div className={`amp-msg amp-msg--${msg.type}`}>{msg.text}</div>
      )}

      {/* ── Order list ── */}
      {loading ? (
        <div className="amp-loading">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="amp-empty">
          <span>📭</span>
          <p>No {tab.toLowerCase()} payments found.</p>
        </div>
      ) : (
        <>
          <div className="amp-count">
            Showing {orders.length} of {total} {tab.toLowerCase()} payment{total !== 1 ? "s" : ""}
          </div>

          <div className="amp-list">
            {orders.map((order) => {
              const mp        = order.manualPayment || {};
              const customer  = order.user          || {};
              const isActing  = acting[order._id];
              const screenshotFull = mp.screenshotUrl ? `${BASE}${mp.screenshotUrl}` : null;

              return (
                <div className="amp-card" key={order._id}>

                  {/* ── Card header ── */}
                  <div className="amp-card-header">
                    <div className="amp-card-meta">
                      <span className="amp-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className={badgeClass(mp.verificationStatus)}>
                        {mp.verificationStatus}
                      </span>
                    </div>
                    <div className="amp-card-info">
                      <span className="amp-method-tag">{order.paymentMethod}</span>
                      <span className="amp-amount">ETB {Number(order.totalPrice).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div className="amp-card-body">
                    <div className="amp-info-grid">

                      <div className="amp-info-item">
                        <span className="amp-label">Customer</span>
                        <span className="amp-val">{customer.fullName || "—"}</span>
                      </div>
                      <div className="amp-info-item">
                        <span className="amp-label">Email</span>
                        <span className="amp-val">{customer.email || "—"}</span>
                      </div>
                      <div className="amp-info-item">
                        <span className="amp-label">Phone</span>
                        <span className="amp-val">{customer.phone || order.shippingAddress?.phone || "—"}</span>
                      </div>

                      <div className="amp-info-item">
                        <span className="amp-label">Order Date</span>
                        <span className="amp-val">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <div className="amp-info-item">
                        <span className="amp-label">Screenshot Uploaded</span>
                        <span className="amp-val">
                          {mp.uploadedAt
                            ? new Date(mp.uploadedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                        </span>
                      </div>
                      <div className="amp-info-item">
                        <span className="amp-label">Order Status</span>
                        <span className="amp-val">{order.orderStatus}</span>
                      </div>

                    </div>

                    {/* ── Screenshot preview ── */}
                    {screenshotFull ? (
                      <div className="amp-screenshot-section">
                        <p className="amp-screenshot-label">Payment Screenshot</p>
                        <div className="amp-screenshot-thumb-wrap">
                          <img
                            src={screenshotFull}
                            alt="Payment screenshot"
                            className="amp-screenshot-thumb"
                            onClick={() => setModalSrc(screenshotFull)}
                          />
                          <button
                            className="amp-preview-btn"
                            onClick={() => setModalSrc(screenshotFull)}
                          >
                            🔍 Preview
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="amp-no-screenshot">No screenshot uploaded yet.</div>
                    )}

                    {/* ── Admin note (read) for non-pending ── */}
                    {mp.adminNote && tab !== "Pending" && (
                      <div className="amp-admin-note-display">
                        <span className="amp-label">Admin Note:</span> {mp.adminNote}
                      </div>
                    )}

                    {/* ── Action area (Pending only) ── */}
                    {tab === "Pending" && (
                      <div className="amp-actions">
                        <div className="amp-note-wrap">
                          <label className="amp-note-label">Admin note (optional — visible to customer if rejected)</label>
                          <textarea
                            className="amp-note-input"
                            placeholder="e.g. Screenshot unclear, please re-upload…"
                            value={notes[order._id] || ""}
                            onChange={(e) =>
                              setNotes((p) => ({ ...p, [order._id]: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="amp-action-btns">
                          <button
                            className="amp-btn amp-btn--verify"
                            onClick={() => handleAction(order._id, "verify")}
                            disabled={!!isActing || !screenshotFull}
                            title={!screenshotFull ? "No screenshot uploaded yet" : ""}
                          >
                            {isActing === "verify" ? "Verifying…" : "✓ Verify Payment"}
                          </button>
                          <button
                            className="amp-btn amp-btn--reject"
                            onClick={() => handleAction(order._id, "reject")}
                            disabled={!!isActing}
                          >
                            {isActing === "reject" ? "Rejecting…" : "✕ Reject"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="amp-pagination">
              <button
                className="amp-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="amp-page-info">Page {page} of {pages}</span>
              <button
                className="amp-page-btn"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Image Preview Modal ── */}
      {modalSrc && (
        <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />
      )}

    </div>
  );
};

export default AdminManualPayments;
