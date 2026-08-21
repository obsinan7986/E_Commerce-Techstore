/**
 * Finance Dashboard — /finance/dashboard
 * Financial overview: revenue, payments, manual verification queue,
 * method breakdown, monthly trend, recent transactions.
 * All data is live from MongoDB — no fake numbers.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFinanceDashboard } from "../services/adminservice";
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

      {/* Header */}
      <div className="fd-header">
        <div>
          <h1>Finance Dashboard</h1>
          <p>Welcome, <strong>{user?.fullName}</strong> · Financial overview</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="fd-refresh-btn" onClick={load}>↻ Refresh</button>
          <Link to="/finance/payments" className="fd-primary-btn">View All Payments →</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fd-kpis">
        <div className="fd-kpi fd-kpi--revenue">
          <span className="fd-kpi-icon">💰</span>
          <div>
            <strong>ETB {fmtK(d.totalRevenue)}</strong>
            <span>Total Revenue</span>
            <small>{d.paidCount || 0} paid orders</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--pending">
          <span className="fd-kpi-icon">⏳</span>
          <div>
            <strong>{d.pendingCount || 0}</strong>
            <span>Pending Payments</span>
            <small>Awaiting completion</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--failed">
          <span className="fd-kpi-icon">❌</span>
          <div>
            <strong>{d.failedCount || 0}</strong>
            <span>Failed Payments</span>
            <small>Requires attention</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--refunded">
          <span className="fd-kpi-icon">↩</span>
          <div>
            <strong>{d.refundedCount || 0}</strong>
            <span>Refunded</span>
            <small>Marked refunded</small>
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

      {/* Recent transactions */}
      <div className="fd-card fd-card--recent">
        <div className="fd-card-header">
          <h2>Recent Transactions</h2>
          <Link to="/finance/payments" className="fd-view-all">View all →</Link>
        </div>
        {!(d.recentTransactions?.length) ? (
          <div className="fd-empty">No transactions yet</div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(d.recentTransactions || []).map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/finance/payments?orderId=${t._id}`}
                        className="fd-order-link">
                        #{t._id.toString().slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div className="fd-customer-cell">
                        <strong>{t.user?.fullName || "—"}</strong>
                        <small>{t.user?.email || ""}</small>
                      </div>
                    </td>
                    <td><span className="fd-method-tag">{t.paymentMethod}</span></td>
                    <td>ETB {fmt(t.totalPrice)}</td>
                    <td><span className={payStatusCls(t.paymentStatus)}>{t.paymentStatus}</span></td>
                    <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
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
