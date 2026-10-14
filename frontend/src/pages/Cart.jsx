import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaShoppingCart,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";

import "../styles/cart.css";
import { BASE_URL } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

const Cart = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [cart, setCart] = useState({ items: [] });
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();
      setCart(data.cart || { items: [] });
      setTotalPrice(data.totalPrice || 0);
    } catch (err) {
      console.error("Cart error:", err);
      setError(err.response?.data?.message || "Failed to load your cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const increaseQty = async (productId, quantity) => {
    try {
      await updateCartItem(productId, quantity + 1);
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update quantity.");
    }
  };

  const decreaseQty = async (productId, quantity) => {
    if (quantity <= 1) return;
    try {
      await updateCartItem(productId, quantity - 1);
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update quantity.");
    }
  };

  const removeItem = async (productId) => {
    try {
      await removeCartItem(productId);
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove product.");
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    try {
      await clearCart();
      await loadCart();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to clear cart.");
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">{t("common.loading") || "Loading cart..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-error">
          <h2>{t("common.error") || "Error"}</h2>
          <p>{error}</p>
          <button onClick={loadCart}>{t("common.retry") || "Retry"}</button>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <FaShoppingCart className="empty-cart-icon" />
          <h1>{t("cart.empty") || "Your cart is empty"}</h1>
          <p>You haven't added any products to your cart yet.</p>
          <Link to="/" className="continue-shopping">
            <FaArrowLeft /> {t("cart.continueShopping") || "Continue Shopping"}
          </Link>
        </div>
      </div>
    );
  }

  const totalItemsCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <div>
            <h1>{t("cart.title") || "Shopping Cart"}</h1>
            <p>
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          <button className="clear-cart-btn" onClick={handleClearCart}>
            <FaTrash /> Clear Cart
          </button>
        </div>

        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
        <div className="cart-content">
          {/* Left Column: Cart Items List */}
          <div className="cart-items">
            {cart.items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const isOutOfStock = product.stock === 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;

              return (
                <div className="cart-item" key={product._id}>
                  {/* Thumbnail */}
                  <Link to={`/product/${product._id}`} className="cart-image">
                    <img
                      src={
                        product.image?.startsWith("http")
                          ? product.image
                          : `${BASE_URL}${product.image}`
                      }
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = "/placeholder.png";
                      }}
                    />
                  </Link>

                  {/* Info */}
                  <div className="cart-info">
                    <div className="cart-product-top">
                      {product.category && (
                        <span className="cart-badge" style={{ background: "#F1F5F9", color: "#475569" }}>
                          {product.category}
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="cart-badge" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="cart-badge cart-badge--low-stock">
                          Only {product.stock} left
                        </span>
                      ) : (
                        <span className="cart-badge cart-badge--in-stock">In Stock</span>
                      )}
                    </div>

                    <Link to={`/product/${product._id}`} className="cart-product-name">
                      {product.name}
                    </Link>

                    {product.brand && <p className="cart-brand">{product.brand}</p>}

                    <div className="cart-unit-price">{formatPrice(product.price)}</div>

                    {/* Actions: Stepper + Trash */}
                    <div className="cart-actions">
                      <div className="quantity-box">
                        <button
                          type="button"
                          onClick={() => decreaseQty(product._id, item.quantity)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => increaseQty(product._id, item.quantity)}
                          disabled={product.stock !== undefined && item.quantity >= product.stock}
                          aria-label="Increase quantity"
                        >
                          <FaPlus />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeItem(product._id)}
                        title="Remove item"
                      >
                        <FaTrash />
                        <span>{t("cart.remove") || "Remove"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="item-total">
                    {formatPrice(product.price * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Order Summary */}
          <aside className="cart-summary">
            <h2>{t("cart.subtotal") || "Order Summary"}</h2>

            <div className="summary-row">
              <span>Items Total ({totalItemsCount})</span>
              <strong>{formatPrice(Number(totalPrice))}</strong>
            </div>

            <div className="summary-row">
              <span>Standard Delivery</span>
              <strong className="free">FREE</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>{t("cart.total") || "Estimated Total"}</span>
              <strong>{formatPrice(Number(totalPrice))}</strong>
            </div>

            <button
              type="button"
              className="checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              <span>{t("cart.checkout") || "Proceed to Checkout"}</span>
              <FaArrowRight />
            </button>

            <Link to="/products" className="continue-link">
              <FaArrowLeft /> {t("cart.continueShopping") || "Continue Shopping"}
            </Link>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.8rem",
                color: "#64748B",
              }}
            >
              <FaShieldAlt color="#059669" size={15} />
              <span>Safe & Secure Chapa / Telebirr payment checkout</span>
            </div>
          </aside>
        </div>

        {/* ── Fixed Mobile Sticky Bottom Checkout Bar ── */}
        <div className="cart-mobile-bar">
          <div className="cart-mobile-bar-info">
            <span className="cart-mobile-bar-label">Total ({totalItemsCount} items)</span>
            <strong className="cart-mobile-bar-price">{formatPrice(Number(totalPrice))}</strong>
          </div>
          <button
            type="button"
            className="cart-mobile-bar-btn"
            onClick={() => navigate("/checkout")}
          >
            Checkout →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;