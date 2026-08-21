import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../services/orderService";
import { initializeChapaPayment } from "../services/paymentService";
import { useAuth } from "../context/AuthContext";
import "../styles/orders.css";
import { BASE_URL } from "../services/api";



const Orders = () => {
  const { user } = useAuth();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [payingId,   setPayingId]   = useState(null); // order id being retried

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to cancel order.");
    }
  };

  // Retry Chapa payment for an unpaid order
  const handlePayNow = async (order) => {
    try {
      setPayingId(order._id);

      const nameParts = (user?.fullName || "Customer").trim().split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName  = nameParts.slice(1).join(" ") || firstName;
      const email     = user?.email || "";
      const phone     = user?.phone || order.shippingAddress?.phone || "";

      const payment = await initializeChapaPayment({
        orderId:   order._id,
        firstName,
        lastName,
        email,
        phone,
      });

      if (!payment.success || !payment.checkoutUrl) {
        throw new Error(payment.message || "Unable to start payment.");
      }

      window.location.href = payment.checkoutUrl;
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Unable to start payment.");
    } finally {
      setPayingId(null);
    }
  };

  const canCancel     = (status) => status !== "Cancelled" && status !== "Shipped" && status !== "Delivered";
  const canPayNow     = (order)  => order.paymentMethod === "Chapa" && order.paymentStatus !== "Paid" && order.orderStatus !== "Cancelled";

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading ts-loading">Loading your orders…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-error">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={load}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Track and manage your OICT_TechStore orders</p>
        </div>
        <Link to="/products" className="shop-btn">Continue Shopping</Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders. Start shopping to see them here.</p>
          <Link to="/products">Browse Products</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order._id}>

              {/* Top meta bar */}
              <div className="order-top">
                <div className="order-top-meta">
                  <div className="order-meta-item">
                    <span className="order-label">Order ID</span>
                    <span className="order-value">#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="order-meta-item">
                    <span className="order-label">Date</span>
                    <span className="order-value">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="order-meta-item">
                    <span className="order-label">Payment</span>
                    <span className="order-value">{order.paymentMethod}</span>
                  </div>
                  <div className="order-meta-item">
                    <span className="order-label">Total</span>
                    <span className="order-value">ETB {Number(order.totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="order-status-row">
                <span className={`status order-${order.orderStatus.toLowerCase()}`}>
                  {order.orderStatus}
                </span>
                <span className={`payment-status payment-${order.paymentStatus.toLowerCase()}`}>
                  {order.paymentStatus}
                </span>

                {/* Pay Now banner for unpaid Chapa orders */}
                {canPayNow(order) && (
                  <span className="pay-now-hint">⚠ Payment pending</span>
                )}
              </div>

              {/* Products */}
              <div className="order-products">
                {order.orderItems.map((item) => (
                  <div className="order-product" key={item.product}>
                    <img
                      src={item.image?.startsWith("http") ? item.image : `${BASE_URL}${item.image}`}
                      alt={item.name}
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                    />
                    <div className="order-product-info">
                      <h3>{item.name}</h3>
                      <p>Qty: {item.quantity}</p>
                      <strong>ETB {Number(item.price).toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom actions */}
              <div className="order-bottom">
                <div className="order-total-block">
                  <span>Total</span>
                  <strong>ETB {Number(order.totalPrice).toLocaleString()}</strong>
                </div>

                <div className="order-actions">
                  <Link to={`/orders/${order._id}`} className="view-order-btn">
                    View Details
                  </Link>

                  {/* Pay Now — retry Chapa for unpaid orders */}
                  {canPayNow(order) && (
                    <button
                      className="pay-now-btn"
                      onClick={() => handlePayNow(order)}
                      disabled={payingId === order._id}
                    >
                      {payingId === order._id ? "Redirecting…" : "Pay Now"}
                    </button>
                  )}

                  {canCancel(order.orderStatus) && !canPayNow(order) && (
                    <button className="cancel-order-btn" onClick={() => handleCancel(order._id)}>
                      Cancel
                    </button>
                  )}

                  {canCancel(order.orderStatus) && canPayNow(order) && (
                    <button className="cancel-order-btn" onClick={() => handleCancel(order._id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
