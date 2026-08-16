import { useEffect, useState, useCallback } from "react";
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  adminCancelOrder,
} from "../services/adminservice";
import { formatCurrency, formatDate, shortOrderId } from "../utils/formatters";
import "../styles/admin.css";

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

const STATUS_NEXT = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const LIMIT = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminOrders({
        page,
        limit: LIMIT,
        keyword: keyword.trim(),
        orderStatus,
        paymentStatus,
        sort: "newest",
      });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, orderStatus, paymentStatus]);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 3500);
  };

  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const data = await getAdminOrderById(id);
      setSelectedOrder(data.order);
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to load order.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(true);
      await updateOrderStatus(id, status);
      showFeedback("success", `Order marked as ${status}.`);
      setSelectedOrder(null);
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this order? This will restore product stock.")) return;
    try {
      setActionLoading(true);
      await adminCancelOrder(id);
      showFeedback("success", "Order cancelled.");
      setSelectedOrder(null);
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusClass = (s) => `admin-badge status-${(s || "").toLowerCase()}`;
  const payClass   = (s) => `admin-badge payment-${(s || "").toLowerCase()}`;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Order Management</h1>
          <p>{total} total orders</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`admin-feedback admin-feedback--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <input
          className="admin-search"
          type="text"
          placeholder="Search by order ID, customer..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
        />
        <select
          className="admin-select"
          value={orderStatus}
          onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="admin-select"
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading orders...</div>
      ) : error ? (
        <div className="admin-error"><p>{error}</p><button onClick={load}>Retry</button></div>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No orders found.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{shortOrderId(o._id)}</strong></td>
                    <td>
                      <strong>{o.user?.fullName || "—"}</strong>
                      <small>{o.user?.email || ""}</small>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td><span className={payClass(o.paymentStatus)}>{o.paymentStatus}</span></td>
                    <td><span className={statusClass(o.orderStatus)}>{o.orderStatus}</span></td>
                    <td>{formatCurrency(o.totalPrice)}</td>
                    <td>
                      <button
                        className="admin-btn-sm-primary"
                        onClick={() => handleViewDetail(o._id)}
                        disabled={detailLoading}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {pages} · {total} orders</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Order {shortOrderId(selectedOrder._id)}</h2>
                <p>Placed {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-detail-grid">
              <section className="order-detail-section">
                <h3>Customer</h3>
                <p><strong>{selectedOrder.user?.fullName}</strong></p>
                <p>{selectedOrder.user?.email}</p>
                <p>{selectedOrder.user?.phone}</p>
              </section>
              <section className="order-detail-section">
                <h3>Shipping</h3>
                <p>{selectedOrder.shippingAddress?.fullName}</p>
                <p>{selectedOrder.shippingAddress?.phone}</p>
                <p>{selectedOrder.shippingAddress?.address}</p>
                <p>{selectedOrder.shippingAddress?.city}</p>
              </section>
              <section className="order-detail-section">
                <h3>Payment</h3>
                <p>Method: <strong>{selectedOrder.paymentMethod}</strong></p>
                <p>Status: <span className={payClass(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</span></p>
                <p>Amount: <strong>{formatCurrency(selectedOrder.totalPrice)}</strong></p>
                {selectedOrder.paymentResult?.txRef && (
                  <p style={{ fontSize: 12, wordBreak: "break-all" }}>
                    TxRef: <strong>{selectedOrder.paymentResult.txRef}</strong>
                  </p>
                )}
                {selectedOrder.paymentResult?.transactionId && (
                  <p style={{ fontSize: 12, wordBreak: "break-all" }}>
                    Transaction ID: <strong>{selectedOrder.paymentResult.transactionId}</strong>
                  </p>
                )}
                {selectedOrder.paidAt && (
                  <p>Paid at: <strong>{new Date(selectedOrder.paidAt).toLocaleString()}</strong></p>
                )}
                {/* Manual payment screenshot */}
                {selectedOrder.manualPayment?.screenshotUrl && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ marginBottom: 6, fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "#6B7280" }}>
                      Payment Screenshot
                    </p>
                    <a
                      href={`${import.meta.env.VITE_API_URL?.replace("/api","") || "https://e-commerce-techstore-y26d.onrender.com/api"}${selectedOrder.manualPayment.screenshotUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace("/api","") || "https://e-commerce-techstore-y26d.onrender.com/api"}${selectedOrder.manualPayment.screenshotUrl}`}
                        alt="Payment screenshot"
                        style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid #E5E7EB", display: "block" }}
                      />
                      <span style={{ fontSize: 12, color: "#2563EB" }}>Open full size ↗</span>
                    </a>
                    <p style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
                      Verification: <strong>{selectedOrder.manualPayment.verificationStatus || "—"}</strong>
                    </p>
                    {selectedOrder.manualPayment.adminNote && (
                      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        Note: <em>{selectedOrder.manualPayment.adminNote}</em>
                      </p>
                    )}
                  </div>
                )}
              </section>
              <section className="order-detail-section">
                <h3>Order Status</h3>
                <p><span className={statusClass(selectedOrder.orderStatus)}>{selectedOrder.orderStatus}</span></p>
              </section>
            </div>

            <section className="order-detail-section">
              <h3>Items</h3>
              {selectedOrder.orderItems?.map((item, i) => (
                <div key={i} className="order-item-row">
                  <img
                    src={item.image?.startsWith("http") ? item.image : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api"}${item.image}`}
                    alt={item.name}
                    onError={(e) => { e.target.src = "/placeholder.png"; }}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="order-item-price">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </section>

            <section className="order-summary">
              <div><span>Subtotal</span><span>{formatCurrency(selectedOrder.itemsPrice)}</span></div>
              <div><span>Shipping</span><span>{formatCurrency(selectedOrder.shippingPrice)}</span></div>
              <div><span>Tax</span><span>{formatCurrency(selectedOrder.taxPrice)}</span></div>
              <div className="total"><span>Total</span><span>{formatCurrency(selectedOrder.totalPrice)}</span></div>
            </section>

            <div className="admin-modal-actions">
              {STATUS_NEXT[selectedOrder.orderStatus]?.map((next) => (
                <button
                  key={next}
                  className={next === "Cancelled" ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary"}
                  disabled={actionLoading}
                  onClick={() => next === "Cancelled" ? handleCancel(selectedOrder._id) : handleStatusUpdate(selectedOrder._id, next)}
                >
                  {actionLoading ? "Processing..." : (next === "Cancelled" ? "Cancel Order" : `Mark ${next}`)}
                </button>
              ))}
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
