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
  FiTrendingUp,
  FiRefreshCw,
} from "react-icons/fi";
import {
  getAdminDashboard,
  updateOrderStatus,
  getLowStockProducts,
} from "../services/adminservice";
import { toast } from "react-toastify";
import { formatCurrency, formatCompactCurrency } from "../utils/formatters";
import "../styles/admin.css";
import "../styles/adminDashboard.css";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lowStock, setLowStock] = useState([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [result, lowData] = await Promise.all([
        getAdminDashboard(),
        getLowStockProducts().catch(() => ({ products: [] })),
      ]);

      setData(result);
      setLowStock(lowData.products || []);
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
      toast.success(`Order status updated to ${status}.`);
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update order.");
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        <div className="stat-card stat-card--revenue">
          <div className="stat-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
            <FiDollarSign />
          </div>
          <div className="stat-body">
            <span>Total Revenue</span>
            <strong
              className="stat-value stat-value--revenue"
              title={formatCurrency(stats.totalRevenue || stats.revenue || 0)}
            >
              {formatCompactCurrency(stats.totalRevenue || stats.revenue || 0)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#F1F5F9", color: "#0F172A" }}>
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

      {/* ── Executive Operations Vertical Sequence ── */}
      <div className="admin-dashboard-vertical">
        {/* 1. Full-Width Recent Orders Panel */}
        <div className="admin-card-panel" style={{ width: "100%" }}>
          <div className="admin-panel-header">
            <div>
              <h2>Recent Orders</h2>
              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                Latest customer purchases awaiting or undergoing fulfillment
              </span>
            </div>
            <Link to="/admin/orders">View All Orders →</Link>
          </div>

          {!orders.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>No orders found.</div>
          ) : (
            <div className="table-responsive">
              <table className="orders-table" style={{ width: "100%", margin: 0, border: "none" }}>
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
                      <td style={{ whiteSpace: "nowrap" }}>
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
                      <td style={{ fontWeight: 700, whiteSpace: "nowrap", color: "#0F172A" }}>
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
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #CBD5E1",
                            fontSize: "0.85rem",
                            background: "#fff",
                            cursor: "pointer",
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

        {/* 2. Full-Width Inventory Watch Panel */}
        <div className="admin-card-panel" style={{ width: "100%" }}>
          <div className="admin-panel-header">
            <div>
              <h2>Inventory Watch</h2>
              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                Products currently low in stock or out of stock across the catalog
              </span>
            </div>
            <Link to="/admin/products">Catalog →</Link>
          </div>
          <div style={{ padding: 20 }}>
            {!lowStock.length ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#059669", fontSize: "0.95rem", fontWeight: 500 }}>
                <FiCheckCircle style={{ marginRight: 8, verticalAlign: "middle" }} /> All products have healthy stock levels.
              </div>
            ) : (
              <div className="admin-inventory-grid">
                {lowStock.slice(0, 8).map((p) => (
                  <div
                    key={p._id}
                    className="admin-inventory-card"
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "0.9rem",
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                        ETB {Number(p.price).toFixed(0)} · {p.brand || "Generic"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "4px 10px",
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

      </div>
    </div>
  );
};

export default AdminDashboard;