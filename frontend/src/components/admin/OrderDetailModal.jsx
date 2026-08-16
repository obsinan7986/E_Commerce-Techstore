import { createPortal } from "react-dom";
import {
  formatCurrency,
  formatDateTime,
  shortOrderId,
} from "../../utils/formatters";
import StatusBadge from "./StatusBadge";
import OrderStatusTimeline from "./OrderStatusTimeline";

const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

const resolveImage = (image) => {
  if (!image) return "/placeholder-product.png";
  if (image.startsWith("http")) return image;
  return `${IMAGE_BASE}${image}`;
};

const OrderDetailModal = ({ order, open, onClose, onStatusChange, onCancel, actionLoading }) => {
  if (!open || !order) return null;

  const canCancel =
    order.orderStatus !== "Cancelled" &&
    order.orderStatus !== "Shipped" &&
    order.orderStatus !== "Delivered";

  const nextStatuses = {
    Pending: ["Processing"],
    Processing: ["Shipped"],
    Shipped: ["Delivered"],
    Delivered: [],
    Cancelled: [],
  };

  const availableStatuses = nextStatuses[order.orderStatus] || [];

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal admin-modal-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div>
            <h2>{shortOrderId(order._id)}</h2>
            <p>Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <OrderStatusTimeline status={order.orderStatus} />

        <div className="order-detail-grid">
          <section className="order-detail-section">
            <h3>Customer</h3>
            <p><strong>{order.user?.fullName || "—"}</strong></p>
            <p>{order.user?.email || "—"}</p>
            <p>{order.user?.phone || "—"}</p>
          </section>

          <section className="order-detail-section">
            <h3>Shipping Address</h3>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.phone}</p>
            <p>{order.shippingAddress?.address}</p>
            <p>
              {order.shippingAddress?.subCity
                ? `${order.shippingAddress.subCity}, `
                : ""}
              {order.shippingAddress?.city}
            </p>
          </section>

          <section className="order-detail-section">
            <h3>Payment</h3>
            <p>Method: {order.paymentMethod}</p>
            <p>
              Status:{" "}
              <StatusBadge type="payment" value={order.paymentStatus} />
            </p>
            {order.paymentResult?.transactionId && (
              <p>Transaction ID: {order.paymentResult.transactionId}</p>
            )}
            {order.paymentResult?.txRef && (
              <p>Tx Ref: {order.paymentResult.txRef}</p>
            )}
            {order.paidAt && <p>Paid: {formatDateTime(order.paidAt)}</p>}
          </section>

          <section className="order-detail-section">
            <h3>Order Status</h3>
            <p>
              <StatusBadge type="status" value={order.orderStatus} />
            </p>
            <p>Updated: {formatDateTime(order.updatedAt)}</p>
            {order.deliveredAt && (
              <p>Delivered: {formatDateTime(order.deliveredAt)}</p>
            )}
          </section>
        </div>

        <section className="order-detail-section">
          <h3>Items</h3>
          <div className="order-items-list">
            {order.orderItems?.map((item, index) => (
              <div key={`${item.product}-${index}`} className="order-item-row">
                <img
                  src={resolveImage(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/64?text=No+Image";
                  }}
                />
                <div>
                  <strong>{item.name}</strong>
                  <p>Qty: {item.quantity}</p>
                </div>
                <div className="order-item-price">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="order-summary">
          <div><span>Subtotal</span><span>{formatCurrency(order.itemsPrice)}</span></div>
          <div><span>Shipping</span><span>{formatCurrency(order.shippingPrice)}</span></div>
          <div><span>Tax</span><span>{formatCurrency(order.taxPrice)}</span></div>
          <div className="total"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
        </section>

        <div className="admin-modal-actions">
          {availableStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={actionLoading}
              onClick={() => onStatusChange(order._id, status)}
            >
              Mark as {status}
            </button>
          ))}
          {canCancel && (
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={actionLoading}
              onClick={() => onCancel(order._id)}
            >
              Cancel Order
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailModal;
