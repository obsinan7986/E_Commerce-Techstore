import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminDashboard,
  updateOrderStatus,
} from "../services/adminservice";

import "../styles/admin.css";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getAdminDashboard();

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (
    orderId,
    status
  ) => {
    try {
      await updateOrderStatus(
        orderId,
        status
      );

      await loadDashboard();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to update order."
      );
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <h2>Access denied</h2>
          <p>{error}</p>

          <button onClick={loadDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.statistics || {};
  const orders = data?.recentOrders || [];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>

          <p>
            Manage your <b>OBSA_TechStore</b> store
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadDashboard}
        >
          Refresh
        </button>
      </div>

      {/* Statistics */}

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Revenue</span>

          <strong>
            ETB{" "}
            {Number(
              stats.totalRevenue || stats.revenue || 0
            ).toFixed(2)}
          </strong>
        </div>

        <div className="stat-card">
          <span>Total Orders</span>

          <strong>
            {stats.totalOrders || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Pending Orders</span>

          <strong>
            {stats.pendingOrders || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Products</span>

          <strong>
            {stats.totalProducts || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Customers</span>

          <strong>
            {stats.totalUsers || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Delivered</span>

          <strong>
            {stats.deliveredOrders || 0}
          </strong>
        </div>
      </div>

      {/* Quick actions */}
      <div className="admin-actions">
        <Link to="/admin/analytics" style={{ color: "#7C3AED", borderColor: "#DDD6FE", background: "#F5F3FF" }}>
          📊 Analytics
        </Link>
        <Link to="/admin/products">
          Manage Products
        </Link>
        <Link to="/admin/orders">
          Manage Orders
        </Link>
        <Link to="/admin/users">
          Manage Users
        </Link>
        <Link to="/admin/coupons" style={{ color: "#0369A1", borderColor: "#BAE6FD", background: "#F0F9FF" }}>
          🏷 Coupons
        </Link>
        <Link to="/admin/messages" style={{ color: "#7C3AED", borderColor: "#DDD6FE", background: "#F5F3FF" }}>
          💬 Messages
        </Link>
        <Link to="/admin/manual-payments" style={{ color: "#B45309", borderColor: "#FDE68A", background: "#FFFBEB" }}>
          💳 Payment Verification
        </Link>
        <Link to="/admin/payment-settings" style={{ color: "#166534", borderColor: "#86EFAC", background: "#F0FDF4" }}>
          ⚙ Payment Settings
        </Link>
      </div>

      {/* Recent Orders */}

      <section className="recent-orders">
        <div className="section-header">
          <h2>Recent Orders</h2>

          <Link to="/admin/orders">
            View All
          </Link>
        </div>

        {!orders.length ? (
          <div className="no-orders">
            No orders found.
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
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
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      #
                      {order._id
                        .slice(-8)
                        .toUpperCase()}
                    </td>

                    <td>
                      <strong>
                        {order.user?.fullName ||
                          "Unknown"}
                      </strong>

                      <small>
                        {order.user?.email ||
                          ""}
                      </small>
                    </td>

                    <td>
                      ETB{" "}
                      {Number(
                        order.totalPrice
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`admin-badge payment-${order.paymentStatus.toLowerCase()}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-badge status-${order.orderStatus.toLowerCase()}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td>
                      <select
                        value={
                          order.orderStatus
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            order._id,
                            e.target.value
                          )
                        }
                        disabled={
                          order.orderStatus === "Delivered" ||
                          order.orderStatus === "Cancelled"
                        }
                      >
                        {/* Only show valid next transitions */}
                        {order.orderStatus === "Pending" && (<>
                          <option value="Pending">Pending</option>
                          <option value="Processing">→ Processing</option>
                        </>)}
                        {order.orderStatus === "Processing" && (<>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">→ Shipped</option>
                        </>)}
                        {order.orderStatus === "Shipped" && (<>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">→ Delivered</option>
                        </>)}
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
      </section>
    </div>
  );
};

export default AdminDashboard;