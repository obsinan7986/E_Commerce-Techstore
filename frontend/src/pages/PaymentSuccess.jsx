import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyChapaPayment } from "../services/paymentService";
import { getOrderById } from "../services/orderService";
import "../styles/payment-result.css";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus]   = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment…");
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const id     = searchParams.get("orderId");
        const hint   = searchParams.get("status"); // "pending" from callback redirect

        if (!id) {
          setStatus("error");
          setMessage("Order ID is missing. Please check your orders.");
          return;
        }

        setOrderId(id);

        // Fetch the order first — don't trust the query-string status
        const orderRes = await getOrderById(id);
        const order    = orderRes?.order;

        if (!order) {
          setStatus("error");
          setMessage("Order not found.");
          return;
        }

        // If the Chapa callback already marked the order as paid,
        // skip the second verification round-trip.
        if (order.isPaid && order.paymentStatus === "Paid") {
          setStatus("success");
          setMessage("Your payment was confirmed successfully.");
          return;
        }

        // If no txRef exists, the user reached the success page via
        // a non-Chapa payment (e.g. Cash On Delivery)
        const txRef = order?.paymentResult?.txRef;
        if (!txRef) {
          // Non-online-payment order — just show order confirmation
          setStatus("success");
          setMessage("Your order has been placed successfully.");
          return;
        }

        // Backend-authoritative verification
        const payRes = await verifyChapaPayment(txRef);

        if (payRes?.success && payRes?.status === "success") {
          setStatus("success");
          setMessage("Your payment was completed successfully.");
        } else if (payRes?.status === "failed" || payRes?.status === "cancelled") {
          setStatus("failed");
          setMessage("Your payment was declined or cancelled. Please try again.");
        } else {
          // pending — Chapa is still processing
          setStatus("pending");
          setMessage("Your payment is being processed. We will update your order once confirmed.");
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setStatus("error");
        setMessage(err.response?.data?.message || "Payment verification failed. Please check your orders.");
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Verifying ──
  if (status === "verifying") {
    return (
      <div className="payment-result">
        <div className="payment-card">
          <div className="payment-icon loading">⏳</div>
          <h1>Verifying Payment</h1>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  // ── Pending ──
  if (status === "pending") {
    return (
      <div className="payment-result">
        <div className="payment-card">
          <div className="payment-icon loading">🕐</div>
          <h1>Payment Processing</h1>
          <p>{message}</p>
          <div className="payment-actions">
            <Link to={orderId ? `/orders/${orderId}` : "/orders"}>View Order</Link>
            <Link to="/orders">My Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed / Error ──
  if (status === "failed" || status === "error") {
    return (
      <div className="payment-result">
        <div className="payment-card">
          <div className="payment-icon error">✕</div>
          <h1>{status === "failed" ? "Payment Failed" : "Something went wrong"}</h1>
          <p>{message}</p>
          <div className="payment-actions">
            {orderId && <Link to={`/orders/${orderId}`}>View Order</Link>}
            <Link to="/orders">My Orders</Link>
            <Link to="/products">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  return (
    <div className="payment-result">
      <div className="payment-card">
        <div className="payment-icon success">✓</div>
        <h1>Payment Successful!</h1>
        <p>{message}</p>
        <p className="payment-subtitle">
          Thank you for shopping at OICT_TechStore. Your order is confirmed.
        </p>
        <div className="payment-actions">
          {orderId && <Link to={`/orders/${orderId}`}>View Order Details</Link>}
          <Link to="/orders">My Orders</Link>
          <Link to="/products">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
