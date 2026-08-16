import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaShoppingCart,
} from "react-icons/fa";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";

import "../styles/cart.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
  });

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
    } catch (error) {
      console.error("Cart error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load your cart."
      );
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
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update quantity."
      );
    }
  };

  const decreaseQty = async (productId, quantity) => {
    if (quantity <= 1) return;

    try {
      await updateCartItem(productId, quantity - 1);
      await loadCart();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to update quantity."
      );
    }
  };

  const removeItem = async (productId) => {
    try {
      await removeCartItem(productId);
      await loadCart();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to remove product."
      );
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      await loadCart();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to clear cart."
      );
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          Loading your cart...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <div className="cart-error">
          <h2>Something went wrong</h2>

          <p>{error}</p>

          <button onClick={loadCart}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <FaShoppingCart className="empty-cart-icon" />

          <h1>Your Cart is Empty</h1>

          <p>
            You haven't added any products to your cart yet.
          </p>

          <Link to="/" className="continue-shopping">
            <FaArrowLeft />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">

      <div className="cart-container">

        <div className="cart-header">
          <div>
            <h1>Shopping Cart</h1>

            <p>
              {cart.items.length}{" "}
              {cart.items.length === 1
                ? "item"
                : "items"}{" "}
              in your cart
            </p>
          </div>

          <button
            className="clear-cart-btn"
            onClick={handleClearCart}
          >
            <FaTrash />
            Clear Cart
          </button>
        </div>

        <div className="cart-content">

          <div className="cart-items">

            {cart.items.map((item) => {

              const product = item.product;

              return (
                <div
                  className="cart-item"
                  key={product._id}
                >

                  <Link
                    to={`/product/${product._id}`}
                    className="cart-image"
                  >
                    <img
                      src={product.image?.startsWith("http") ? product.image : `${BASE}${product.image}`}
                      alt={product.name}
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                    />
                  </Link>

                  <div className="cart-info">

                    <Link
                      to={`/product/ETB{product._id}`}
                      className="cart-product-name"
                    >
                      {product.name}
                    </Link>

                    <p className="cart-brand">
                      {product.brand}
                    </p>

                    <p className="cart-price">
                      ETB {product.price.toLocaleString()}
                    </p>

                    <div className="cart-actions">

                      <div className="quantity-box">

                        <button
                          onClick={() =>
                            decreaseQty(
                              product._id,
                              item.quantity
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <FaMinus />
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQty(
                              product._id,
                              item.quantity
                            )
                          }
                        >
                          <FaPlus />
                        </button>

                      </div>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeItem(product._id)
                        }
                      >
                        <FaTrash />
                        Remove
                      </button>

                    </div>

                  </div>

                  <div className="item-total">
                    ETB {(product.price * item.quantity).toLocaleString()}
                  </div>

                </div>
              );
            })}

          </div>

          <aside className="cart-summary">

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>

              <strong>
                ETB {Number(totalPrice).toLocaleString()}
              </strong>
            </div>

            <div className="summary-row">
              <span>Shipping</span>

              <strong className="free">
                FREE
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                ETB {Number(totalPrice).toLocaleString()}
              </strong>
            </div>

            <button
              className="checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>

            <Link
              to="/products"
              className="continue-link"
            >
              <FaArrowLeft />
              Continue Shopping
            </Link>

          </aside>

        </div>

      </div>

    </div>
  );
};

export default Cart;