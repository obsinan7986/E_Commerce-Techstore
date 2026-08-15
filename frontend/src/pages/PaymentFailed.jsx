import { Link, useSearchParams } from "react-router-dom";
import "../styles/payment-result.css";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="payment-result">
      <div className="payment-card">
        <div className="payment-icon error">✕</div>

        <h1>Payment Failed</h1>

        <p>
          Your payment was not completed successfully.
          Your order has <strong>not</strong> been charged.
        </p>

        <div className="payment-actions">
          {orderId && (
            <Link to={`/orders/${orderId}`}>View Order</Link>
          )}
          <Link to="/orders">My Orders</Link>
          <Link to="/products">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
