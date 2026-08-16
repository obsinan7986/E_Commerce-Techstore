import { Link } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { useCart } from "../context/CartContext";
import "../styles/productcard.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

/* ── Stock status helper ── */
const stockStatus = (stock) => {
  if (stock === 0)  return { label: "Out of Stock", cls: "stock-badge--out",  text: "✗ Out of Stock" };
  if (stock <= 9)   return { label: "Low Stock",    cls: "stock-badge--low",  text: `⚠ Only ${stock} left` };
  return              { label: "In Stock",     cls: "stock-badge--in",   text: "✓ In Stock" };
};

const ProductCard = ({ product }) => {
  const { loadCartCount } = useCart();

  const handleAddCart = async () => {
    try {
      await addToCart(product._id, 1);
      await loadCartCount();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleWishlist = async () => {
    try {
      await addToWishlist(product._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to wishlist");
    }
  };

  const oldPrice = Math.round(product.price * 1.2);
  const inStock  = product.stock > 0;
  const status   = stockStatus(product.stock);
  const imgSrc   = product.image?.startsWith("http")
    ? product.image
    : `${BASE}${product.image}`;

  return (
    <div className="product-card">

      {/* Discount badge */}
      <div className="discount-badge">-20%</div>

      {/* Stock badge — Out of Stock or Low Stock on the image */}
      {product.stock <= 9 && (
        <div className={`stock-badge ${status.cls}`}>{status.label}</div>
      )}

      {/* Wishlist */}
      <button className="wishlist-btn" onClick={handleWishlist} aria-label="Add to wishlist" type="button">
        <FaHeart />
      </button>

      {/* Image */}
      <Link to={`/product/${product._id}`} className="product-image">
        <img
          src={imgSrc}
          alt={product.name}
          onError={(e) => { e.target.style.opacity = "0.3"; }}
          style={!inStock ? { opacity: 0.45, filter: "grayscale(40%)" } : undefined}
        />
        <span className="quick-view">Quick View</span>
      </Link>

      {/* Info */}
      <div className="product-info">
        <span className="brand">{product.brand}</span>

        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>

        {/* Stars */}
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={12} color={i < Math.round(product.rating) ? "#F59E0B" : "#E2E8F0"} />
          ))}
          <span>({product.numReviews || 0})</span>
        </div>

        {/* Price */}
        <div className="price-box">
          <span className="new-price">ETB {product.price.toLocaleString()}</span>
          <span className="old-price">ETB {oldPrice.toLocaleString()}</span>
        </div>

        {/* Stock status text */}
        <div className={`stock ${inStock ? "in-stock" : "out-stock"}`} style={{ fontSize: 12 }}>
          {status.text}
        </div>

        <button
          className="cart-btn"
          disabled={!inStock}
          onClick={handleAddCart}
          type="button"
        >
          <FaShoppingCart size={13} />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
