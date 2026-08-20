/**
 * Admin Analytics Dashboard
 * Pure-CSS charts — no external chart library needed.
 * Data from GET /api/admin/analytics
 */
import { useEffect, useState } from "react";
import { Link }                from "react-router-dom";
import { getAnalytics }        from "../services/adminservice";
import "../styles/adminAnalytics.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

/* ─── helpers ─────────────────────────────────────────────── */
const fmt   = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtK  = (n) => { n = Number(n || 0); return n >= 1_000_000 ? (n/1_000_000).toFixed(1)+"M" : n >= 1_000 ? (n/1_000).toFixed(1)+"K" : String(n); };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const pctColor = (v) => (v === null || v === undefined) ? "" : Number(v) >= 0 ? "ana-pct--up" : "ana-pct--down";
const pctSign  = (v) => (v === null || v === undefined) ? "—" : `${Number(v) >= 0 ? "+" : ""}${v}%`;

/* ─── KPI Card ─────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, sub, pct, color }) => (
  <div className="ana-kpi" style={{ "--kpi-color": color }}>
    <div className="ana-kpi-icon">{icon}</div>
    <div className="ana-kpi-body">
      <span className="ana-kpi-label">{label}</span>
      <strong className="ana-kpi-value">{value}</strong>
      <div className="ana-kpi-foot">
        <span className="ana-kpi-sub">{sub}</span>
        {pct !== undefined && (
          <span className={`ana-pct ${pctColor(pct)}`}>{pctSign(pct)} vs last month</span>
        )}
      </div>
    </div>
  </div>
);

/* ─── Bar Chart (pure CSS) ─────────────────────────────────── */
const BarChart = ({ data }) => {
  if (!data?.length) return <div className="ana-chart-empty">No data yet</div>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="ana-bar-chart">
      {data.map((d, i) => {
        const pct = Math.max((d.revenue / max) * 100, 1);
        const label = `${MONTHS[(d._id.month - 1) % 12]} ${String(d._id.year).slice(-2)}`;
        return (
          <div className="ana-bar-col" key={i}>
            <div className="ana-bar-tooltip">ETB {fmt(d.revenue)}<br />{d.orderCount} orders</div>
            <div className="ana-bar" style={{ height: `${pct}%` }} />
            <span className="ana-bar-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Donut / Pie chart (conic-gradient) ──────────────────── */
const DonutChart = ({ orderStatus }) => {
  const s = orderStatus || {};
  const total = (s.pending||0)+(s.processing||0)+(s.shipped||0)+(s.delivered||0)+(s.cancelled||0);
  if (!total) return <div className="ana-chart-empty">No orders yet</div>;

  const slices = [
    { label: "Pending",    value: s.pending||0,    color: "#F59E0B" },
    { label: "Processing", value: s.processing||0, color: "#3B82F6" },
    { label: "Shipped",    value: s.shipped||0,    color: "#8B5CF6" },
    { label: "Delivered",  value: s.delivered||0,  color: "#10B981" },
    { label: "Cancelled",  value: s.cancelled||0,  color: "#EF4444" },
  ].filter((s) => s.value > 0);

  // Build conic-gradient stops
  let acc = 0;
  const stops = slices.map((sl) => {
    const start = acc;
    acc += (sl.value / total) * 360;
    return `${sl.color} ${start.toFixed(1)}deg ${acc.toFixed(1)}deg`;
  }).join(", ");

  return (
    <div className="ana-donut-wrap">
      <div className="ana-donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="ana-donut-hole">
          <strong>{total}</strong>
          <span>orders</span>
        </div>
      </div>
      <div className="ana-donut-legend">
        {slices.map((sl) => (
          <div className="ana-legend-item" key={sl.label}>
            <span className="ana-legend-dot" style={{ background: sl.color }} />
            <span className="ana-legend-label">{sl.label}</span>
            <span className="ana-legend-val">
              {sl.value} <em>({((sl.value/total)*100).toFixed(0)}%)</em>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */
const AdminAnalytics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAnalytics();
      setData(res);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="admin-page">
      <div className="admin-loading">Loading analytics…</div>
    </div>
  );

  if (error) return (
    <div className="admin-page">
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={load}>Retry</button>
      </div>
    </div>
  );

  const { kpi, orderStatus, monthlySales, topProducts, lowStock, recentOrders } = data;

  return (
    <div className="admin-page ana-page">

      {/* ── Header ── */}
      <div className="admin-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>
            OICT_TechStore · {lastRefresh && (
              <span>Last updated {lastRefresh.toLocaleTimeString("en-US", { timeStyle: "short" })}</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/admin/manual-payments" className="ana-nav-link ana-nav-link--warn">
            💳 Manual Payments
          </Link>
          <Link to="/admin/orders" className="ana-nav-link">
            📋 All Orders
          </Link>
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="ana-kpi-grid">
        <KpiCard
          icon="💰"
          label="Total Revenue"
          value={`ETB ${fmt(kpi.totalRevenue)}`}
          sub={`This month: ETB ${fmtK(kpi.revenueThisMonth)}`}
          pct={kpi.pctRevenue}
          color="#2563EB"
        />
        <KpiCard
          icon="🛒"
          label="Total Orders"
          value={fmt(kpi.totalOrders)}
          sub={`This month: ${kpi.ordersThisMonth}`}
          pct={kpi.pctOrders}
          color="#8B5CF6"
        />
        <KpiCard
          icon="👥"
          label="Total Customers"
          value={fmt(kpi.totalUsers)}
          sub={`New this month: ${kpi.newCustomersThisMonth}`}
          pct={kpi.pctCustomers}
          color="#10B981"
        />
        <KpiCard
          icon="📦"
          label="Total Products"
          value={fmt(kpi.totalProducts)}
          sub={`Low stock: ${lowStock?.length || 0} item${lowStock?.length !== 1 ? "s" : ""}`}
          color="#F59E0B"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="ana-charts-row">

        {/* Revenue bar chart */}
        <div className="ana-card ana-card--bar">
          <div className="ana-card-header">
            <h2>Monthly Revenue</h2>
            <span className="ana-card-sub">Last 12 months · paid orders only</span>
          </div>
          <div className="ana-card-body">
            <BarChart data={monthlySales} />
          </div>
        </div>

        {/* Order status donut */}
        <div className="ana-card ana-card--donut">
          <div className="ana-card-header">
            <h2>Order Status</h2>
            <span className="ana-card-sub">All-time breakdown</span>
          </div>
          <div className="ana-card-body">
            <DonutChart orderStatus={orderStatus} />
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="ana-bottom-row">

        {/* Top selling products */}
        <div className="ana-card ana-card--top">
          <div className="ana-card-header">
            <h2>Top Selling Products</h2>
            <span className="ana-card-sub">By units sold (excl. cancelled)</span>
          </div>
          <div className="ana-card-body">
            {!topProducts?.length ? (
              <div className="ana-empty">No sales data yet</div>
            ) : (
              <div className="ana-top-list">
                {topProducts.map((p, i) => (
                  <div className="ana-top-item" key={String(p._id)}>
                    <span className="ana-top-rank">{i + 1}</span>
                    <img
                      src={p.image?.startsWith("http") ? p.image : `${BASE}${p.image}`}
                      alt={p.name}
                      className="ana-top-img"
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                    />
                    <div className="ana-top-info">
                      <span className="ana-top-name">{p.name}</span>
                      <span className="ana-top-rev">ETB {fmt(p.totalRevenue)}</span>
                    </div>
                    <div className="ana-top-qty-wrap">
                      <span className="ana-top-qty">{p.totalQty}</span>
                      <span className="ana-top-qty-label">sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low stock alert */}
        <div className="ana-card ana-card--stock">
          <div className="ana-card-header">
            <h2>⚠ Low Stock</h2>
            <span className="ana-card-sub">≤ 5 units remaining</span>
          </div>
          <div className="ana-card-body">
            {!lowStock?.length ? (
              <div className="ana-empty ana-empty--good">✓ All products well stocked</div>
            ) : (
              <div className="ana-stock-list">
                {lowStock.map((p) => (
                  <div className="ana-stock-item" key={p._id}>
                    <img
                      src={p.image?.startsWith("http") ? p.image : `${BASE}${p.image}`}
                      alt={p.name}
                      className="ana-stock-img"
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                    />
                    <div className="ana-stock-info">
                      <span className="ana-stock-name">{p.name}</span>
                      <span className="ana-stock-cat">{p.category}</span>
                    </div>
                    <div className={`ana-stock-badge ${p.stock === 0 ? "ana-stock-badge--out" : "ana-stock-badge--low"}`}>
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="ana-card ana-card--recent">
        <div className="ana-card-header">
          <h2>Recent Orders</h2>
          <Link to="/admin/orders" className="ana-view-all">View all →</Link>
        </div>
        <div className="ana-card-body ana-card-body--table">
          {!recentOrders?.length ? (
            <div className="ana-empty">No orders yet</div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <Link to="/admin/orders" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 700 }}>
                          #{o._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <strong>{o.user?.fullName || "—"}</strong>
                        <small>{o.user?.email || ""}</small>
                      </td>
                      <td style={{ fontSize: 13 }}>{o.paymentMethod}</td>
                      <td style={{ fontWeight: 700 }}>ETB {fmt(o.totalPrice)}</td>
                      <td>
                        <span className={`admin-badge payment-${(o.paymentStatus||"").toLowerCase()}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge status-${(o.orderStatus||"").toLowerCase()}`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6B7280" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;
