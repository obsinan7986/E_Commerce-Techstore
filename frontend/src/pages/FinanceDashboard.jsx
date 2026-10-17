/**
 * Finance Dashboard — /finance/dashboard
 * Financial overview: revenue, payments, manual verification queue,
 * method breakdown, monthly trend, recent transactions.
 * All data is live from MongoDB — no fake numbers.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { getFinanceDashboard } from "../services/adminservice";
import api from "../services/api";
import "../styles/financeDashboard.css";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt  = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtK = (n) => {
  n = Number(n || 0);
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
       : n >= 1_000     ? (n / 1_000).toFixed(1) + "K"
       : String(n);
};

const payStatusCls = (s) => ({
  Paid:     "fd-badge fd-badge--paid",
  Pending:  "fd-badge fd-badge--pending",
  Failed:   "fd-badge fd-badge--failed",
  Refunded: "fd-badge fd-badge--refunded",
}[s] || "fd-badge");

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const handleApprovePayout = async (payoutId, amount) => {
    try {
      setApprovingId(payoutId);
      const res = await api.patch(`/finance/payouts/${payoutId}/approve`, { action: "approve" });
      toast.success(res.data?.message || `Payout of ETB ${fmt(amount)} approved and marked paid!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve payout request.");
    } finally {
      setApprovingId(null);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFinanceDashboard();
      setData(res.dashboard);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="fd-page"><div className="fd-loading">Loading…</div></div>;
  if (error)   return (
    <div className="fd-page">
      <div className="fd-error"><p>{error}</p><button onClick={load}>Retry</button></div>
    </div>
  );

  const d = data || {};
  const maxMonthly = Math.max(...(d.monthlyRevenue || []).map(m => m.total), 1);

  return (
    <div className="fd-page">

      {/* Header Toolbar */}
      <div className="fd-header" style={{ marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.95rem" }}>
            Welcome, <strong>{user?.fullName}</strong> · Gross revenue, debited CEO commission margin & seller liabilities
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="fd-refresh-btn" onClick={load}>↻ Refresh</button>
          <Link to="/finance/payments" className="fd-primary-btn">View All Payments →</Link>
        </div>
      </div>

      {/* KPI Cards — Automated Commission & Ledger Engine */}
      <div className="fd-kpis">
        <div className="fd-kpi fd-kpi--revenue">
          <span className="fd-kpi-icon">💰</span>
          <div>
            <strong>ETB {fmt(d.platformTotalRevenue || d.totalGrossSales || d.totalRevenue)}</strong>
            <span>Total Gross Revenue</span>
            <small>{d.paidCount || 0} settled orders</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--commission">
          <span className="fd-kpi-icon">🏦</span>
          <div>
            <strong style={{ color: "#059669" }}>ETB {fmt(d.platformTotalCommission)}</strong>
            <span>Platform Commission Revenue</span>
            <small>Debited from seller earnings</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--liability">
          <span className="fd-kpi-icon">👥</span>
          <div>
            <strong style={{ color: "#7C3AED" }}>ETB {fmt(d.totalSellerNetCredits)}</strong>
            <span>Net Seller Payout Liability</span>
            <small>Pending escrow: ETB {fmt(d.pendingSellerCredits)}</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--pending">
          <span className="fd-kpi-icon">⏳</span>
          <div>
            <strong>{d.pendingCount || 0}</strong>
            <span>Pending Payments</span>
            <small>{d.manualPending || 0} manual receipts in queue</small>
          </div>
        </div>
      </div>

      {/* Manual payment queue alert */}
      {(d.manualPending || 0) > 0 && (
        <div className="fd-alert">
          <span>⚠️</span>
          <div>
            <strong>{d.manualPending} manual payment{d.manualPending !== 1 ? "s" : ""} awaiting verification</strong>
            <span>Review and verify or reject customer payment screenshots.</span>
          </div>
          <Link to="/finance/payments?paymentMethod=manual" className="fd-alert-btn">
            Verify Now →
          </Link>
        </div>
      )}

      <div className="fd-row">

        {/* Monthly revenue bar chart */}
        <div className="fd-card fd-card--chart">
          <div className="fd-card-header">
            <h2>Monthly Revenue</h2>
            <span>Last 6 months · paid orders only</span>
          </div>
          {!(d.monthlyRevenue?.length) ? (
            <div className="fd-empty">No revenue data yet</div>
          ) : (
            <div className="fd-bar-chart">
              {(d.monthlyRevenue || []).map((m, i) => {
                const pct  = Math.max((m.total / maxMonthly) * 100, 2);
                const lbl  = `${MONTHS[(m._id.month - 1) % 12]} ${String(m._id.year).slice(-2)}`;
                return (
                  <div className="fd-bar-col" key={i}>
                    <div className="fd-bar-tooltip">ETB {fmt(m.total)}<br />{m.count} order{m.count !== 1 ? "s" : ""}</div>
                    <div className="fd-bar" style={{ height: `${pct}%` }} />
                    <span className="fd-bar-label">{lbl}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="fd-card fd-card--methods">
          <div className="fd-card-header">
            <h2>Payment Methods</h2>
            <span>By paid orders</span>
          </div>
          {!(d.methodBreakdown?.length) ? (
            <div className="fd-empty">No data yet</div>
          ) : (
            <div className="fd-method-list">
              {(d.methodBreakdown || []).map((m) => (
                <div className="fd-method-row" key={m._id}>
                  <span className="fd-method-name">{m._id || "Unknown"}</span>
                  <span className="fd-method-count">{m.count} order{m.count !== 1 ? "s" : ""}</span>
                  <span className="fd-method-amt">ETB {fmt(m.total)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Manual verification sub-stats */}
          <div className="fd-manual-stats">
            <h3>Manual Payments</h3>
            <div className="fd-manual-row"><span>⏳ Pending</span><strong>{d.manualPending || 0}</strong></div>
            <div className="fd-manual-row"><span>✓ Verified</span><strong>{d.manualVerified || 0}</strong></div>
            <div className="fd-manual-row"><span>✕ Rejected</span><strong>{d.manualRejected || 0}</strong></div>
          </div>
        </div>

      </div>

      {/* ── Seller Payout Requests Section ── */}
      <div className="fd-card fd-card--payouts" style={{ marginBottom: 20 }}>
        <div className="fd-card-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>💸 Seller Payout Requests</span>
              {(d.pendingPayouts?.length || 0) > 0 && (
                <span className="fd-badge fd-badge--pending" style={{ fontSize: 12 }}>
                  {d.pendingPayouts.length} Pending
                </span>
              )}
            </h2>
            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
              Disburse seller net earnings (after platform CEO commission debit) directly to verified bank accounts or Telebirr
            </span>
          </div>
          <button className="fd-refresh-btn" onClick={load} style={{ fontSize: 12 }}>
            ↻ Refresh Requests
          </button>
        </div>

        {!(d.pendingPayouts?.length) ? (
          <div className="fd-empty" style={{ padding: "30px 20px" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>✅</span>
            All seller payout requests are processed. No pending requests.
          </div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Seller / Store</th>
                  <th>Contact Info</th>
                  <th style={{ color: "#7C3AED" }}>Requested Net Payout</th>
                  <th>Payout Destination</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {d.pendingPayouts.map((p) => {
                  const s = p.seller || {};
                  const acct = p.accountDetails || s.payoutAccount || {};
                  const isProcessing = approvingId === p._id;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="fd-customer-cell">
                          <strong>{s.storeName || s.fullName || "Seller"}</strong>
                          <small>{s.fullName && s.storeName ? `Owner: ${s.fullName}` : "Verified Seller"}</small>
                        </div>
                      </td>
                      <td>
                        <div className="fd-customer-cell">
                          <span>{s.email || "—"}</span>
                          <small>{s.phone || acct.telebirrPhone || "—"}</small>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: "1.05rem", color: "#7C3AED" }}>
                          ETB {fmt(p.amount)}
                        </strong>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          Net after commission
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                          {acct.bankName && (
                            <div>
                              <strong>{acct.bankName}</strong>
                              <div style={{ fontSize: 12, color: "#4B5563" }}>
                                Acc: {acct.accountNumber || "—"}
                              </div>
                              {acct.accountHolder && (
                                <div style={{ fontSize: 11, color: "#6B7280" }}>
                                  Holder: {acct.accountHolder}
                                </div>
                              )}
                            </div>
                          )}
                          {acct.telebirrPhone && (
                            <div style={{ marginTop: acct.bankName ? 4 : 0, color: "#0284C7" }}>
                              <strong>Telebirr:</strong> {acct.telebirrPhone}
                            </div>
                          )}
                          {!acct.bankName && !acct.telebirrPhone && (
                            <span style={{ color: "#9CA3AF" }}>No account saved</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className="fd-badge fd-badge--pending">
                          ⏳ {p.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="fd-approve-btn"
                          onClick={() => handleApprovePayout(p._id, p.amount)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing…" : "✓ Approve & Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Commission & Revenue Split Ledger */}
      <div className="fd-card fd-card--recent">
        <div className="fd-card-header">
          <div>
            <h2>Automated Commission & Revenue Split Ledger</h2>
            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
              Live split: debits CEO commission from product price and credits platform finance ledger
            </span>
          </div>
          <Link to="/finance/payments" className="fd-view-all">View all payments →</Link>
        </div>
        {!(d.ledgerTransactions?.length) ? (
          <div className="fd-empty">No transaction splits recorded yet</div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Gross Price</th>
                  <th>Seller(s)</th>
                  <th style={{ color: "#059669" }}>Platform Commission</th>
                  <th style={{ color: "#7C3AED" }}>Seller Net Credit</th>
                  <th>Split Settlement</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(d.ledgerTransactions || []).map((t) => {
                  const sellers = (t.orderItems || [])
                    .map((item) => item.seller?.fullName)
                    .filter(Boolean);
                  const uniqueSellers = [...new Set(sellers)];
                  const sellerDisplay = uniqueSellers.length > 0 ? uniqueSellers.join(", ") : "Platform Store";
                  const grossVal = t.totalGrossItemsPrice || t.totalPrice || 0;
                  const commVal = t.totalCommissionDebited || 0;
                  const netVal = t.totalSellerNetPayout || (grossVal - commVal);

                  return (
                    <tr key={t._id}>
                      <td>
                        <Link to={`/finance/payments?orderId=${t._id}`} className="fd-order-link">
                          #{t._id.toString().slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="fd-customer-cell">
                          <strong>{t.user?.fullName || "—"}</strong>
                          <small>{t.user?.email || ""}</small>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>ETB {fmt(grossVal)}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#374151" }}>{sellerDisplay}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#059669" }}>
                        + ETB {fmt(commVal)}
                      </td>
                      <td style={{ fontWeight: 700, color: "#7C3AED" }}>
                        ETB {fmt(netVal)}
                      </td>
                      <td>
                        {t.isCommissionSettled ? (
                          <span className="fd-badge fd-badge--paid" title="Commission debited to Finance & net credited to Seller">
                            ✓ Settled
                          </span>
                        ) : (
                          <span className="fd-badge fd-badge--pending" title="Awaiting payment confirmation">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={payStatusCls(t.paymentStatus)}>{t.paymentStatus}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="fd-quick-links">
        <Link to="/finance/payments" className="fd-quick-link" style={{ "--ql-color": "#2563EB" }}>
          <span>💳</span><div><strong>All Payments</strong><span>View & manage</span></div>
        </Link>
        <Link to="/finance/payments?paymentStatus=Pending" className="fd-quick-link" style={{ "--ql-color": "#D97706" }}>
          <span>⏳</span><div><strong>Pending Payments</strong><span>Awaiting action</span></div>
        </Link>
        <Link to="/finance/payments?paymentStatus=Refunded" className="fd-quick-link" style={{ "--ql-color": "#7C3AED" }}>
          <span>↩</span><div><strong>Refunds</strong><span>Refunded orders</span></div>
        </Link>
      </div>
    </div>
  );
};

export default FinanceDashboard;
