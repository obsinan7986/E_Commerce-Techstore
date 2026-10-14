import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiDollarSign,
  FiShoppingBag,
  FiClock,
  FiPackage,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiTrendingUp,
  FiRefreshCw,
} from "react-icons/fi";
import {
  getAdminDashboard,
  updateOrderStatus,
  getLowStockProducts,
} from "../services/adminservice";
import api, { BASE_URL } from "../services/api";
import "../styles/admin.css";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lowStock, setLowStock] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [result, lowData, pSettingsRes] = await Promise.all([
        getAdminDashboard(),
        getLowStockProducts().catch(() => ({ products: [] })),
        api.get("/payments/settings").catch(() => null),
      ]);

      setData(result);
      setLowStock(lowData.products || []);
      if (pSettingsRes?.data?.settings) {
        setPaymentSettings(pSettingsRes.data.settings);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update order.");
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading operational overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <h2>Access denied</h2>
          <p>{error}</p>
          <button onClick={loadDashboard}>Try Again</button>
        </div>
      </div>
    );
  }

  const stats = data?.statistics || {};
  const orders = data?.recentOrders || [];

  return (
    <div className="admin-page" style={{ padding: "8px 0 40px" }}>
      {/* Action Toolbar — Clean single refresh without duplicate h1/bell */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.95rem" }}>
            Operational metrics, real-time fulfillment, and inventory health
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadDashboard}
          style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <FiRefreshCw /> ↻ Refresh
        </button>
      </div>

      {/* Upgraded 6 KPI Cards with Subtle Icons & Auto-fit Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
            <FiDollarSign />
          </div>
          <div className="stat-body">
            <span>Total Revenue</span>
            <strong title={`ETB ${fmt(stats.totalRevenue || stats.revenue || 0)}`}>
              ETB {fmt(stats.totalRevenue || stats.revenue || 0)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
            <FiShoppingBag />
          </div>
          <div className="stat-body">
            <span>Total Orders</span>
            <strong>{stats.totalOrders || 0}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#FFFBEB", color: "#D97706" }}>
            <FiClock />
          </div>
          <div className="stat-body">
            <span>Pending Orders</span>
            <strong>{stats.pendingOrders || 0}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#F0FDF4", color: "#059669" }}>
            <FiPackage />
          </div>
          <div className="stat-body">
            <span>Catalog Items</span>
            <strong>{stats.totalProducts || 0}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#EFF6FF", color: "#0284C7" }}>
            <FiUsers />
          </div>
          <div className="stat-body">
            <span>Registered Users</span>
            <strong>{stats.totalUsers || 0}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ECFDF5", color: "#047857" }}>
            <FiCheckCircle />
          </div>
          <div className="stat-body">
            <span>Delivered Orders</span>
            <strong>{stats.deliveredOrders || 0}</strong>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "13px 18px",
            marginBottom: 20,
            background: "#FFFBEB",
            border: "1.5px solid #FDE68A",
            borderRadius: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiAlertTriangle size={20} color="#D97706" />
            <div>
              <strong style={{ fontSize: 14, color: "#92400E" }}>
                {lowStock.filter((p) => p.stock === 0).length} out of stock ·{" "}
                {lowStock.filter((p) => p.stock > 0).length} low stock items
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#B45309" }}>
                {lowStock.slice(0, 3).map((p) => p.name).join(", ")}
                {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""}
              </p>
            </div>
          </div>
          <Link
            to="/admin/products"
            state={{ stockFilter: "low" }}
            style={{
              padding: "7px 16px",
              background: "#F59E0B",
              color: "#fff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Manage Stock →
          </Link>
        </div>
      )}

      {/* ── Modern 2-Column Executive Operations Grid ── */}
      <div className="admin-dashboard-grid">
        {/* Left Column: Recent Orders (6 most recent) */}
        <div className="admin-card-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recent Orders</h2>
              <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Latest customer purchases awaiting or undergoing fulfillment
              </span>
            </div>
            <Link to="/admin/orders">View All Orders →</Link>
          </div>

          {!orders.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>No orders found.</div>
          ) : (
            <div className="table-responsive">
              <table className="orders-table" style={{ margin: 0, border: "none" }}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order._id}>
                      <td>
                        <Link
                          to={`/orders/${order._id}`}
                          style={{ fontWeight: 700, color: "#2563EB", textDecoration: "none" }}
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <strong>{order.user?.fullName || "Guest Customer"}</strong>
                        <small style={{ display: "block", color: "#94A3B8", fontSize: "0.75rem" }}>
                          {order.user?.email || "—"}
                        </small>
                      </td>
                      <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        ETB {Number(order.totalPrice).toFixed(2)}
                      </td>
                      <td>
                        <span className={`admin-badge payment-${order.paymentStatus?.toLowerCase()}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge status-${order.orderStatus?.toLowerCase()}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={order.orderStatus === "Delivered" || order.orderStatus === "Cancelled"}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #CBD5E1",
                            fontSize: "0.85rem",
                            background: "#fff",
                          }}
                        >
                          {order.orderStatus === "Pending" && (
                            <>
                              <option value="Pending">Pending</option>
                              <option value="Processing">→ Processing</option>
                            </>
                          )}
                          {order.orderStatus === "Processing" && (
                            <>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">→ Shipped</option>
                            </>
                          )}
                          {order.orderStatus === "Shipped" && (
                            <>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">→ Delivered</option>
                            </>
                          )}
                          {order.orderStatus === "Delivered" && (
                            <option value="Delivered">Delivered ✓</option>
                          )}
                          {order.orderStatus === "Cancelled" && (
                            <option value="Cancelled">Cancelled</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Store Health & Quick Insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Low Stock Items List */}
          <div className="admin-card-panel">
            <div className="admin-panel-header">
              <h2>Inventory Watch</h2>
              <Link to="/admin/products">Catalog →</Link>
            </div>
            <div style={{ padding: 16 }}>
              {!lowStock.length ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#059669", fontSize: "0.9rem" }}>
                  <FiCheckCircle style={{ marginRight: 6 }} /> All products have healthy stock levels.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lowStock.slice(0, 5).map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "#F8FAFC",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            color: "#1E293B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 180,
                          }}
                        >
                          {p.name}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          ETB {Number(p.price).toFixed(0)} · {p.brand}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: p.stock === 0 ? "#FEE2E2" : "#FEF3C7",
                          color: p.stock === 0 ? "#DC2626" : "#B45309",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.stock === 0 ? "Out of Stock" : `${p.stock} units left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform Commission & Revenue Split Card */}
          <div className="admin-card-panel">
            <div className="admin-panel-header">
              <h2>Finance & Commission Ledger</h2>
              <Link to="/finance/dashboard">Split Ledger →</Link>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", color: "#64748B" }}>Platform Gross Volume</span>
                  <strong style={{ fontSize: "1rem", color: "#1E293B" }}>
                    ETB {fmt(paymentSettings?.platformTotalRevenue || stats.totalRevenue || 0)}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", color: "#64748B" }}>Platform Commission Debited</span>
                  <strong style={{ fontSize: "1rem", color: "#059669" }}>
                    ETB {fmt(paymentSettings?.platformTotalCommission || 0)}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", color: "#64748B" }}>Global Baseline Rate</span>
                  <strong style={{ fontSize: "0.95rem", color: "#7C3AED" }}>
                    {paymentSettings?.defaultCommissionRate || 10}%
                  </strong>
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
                  <Link
                    to="/finance/dashboard"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#2563EB",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <span>Open Full Revenue Split Ledger</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;