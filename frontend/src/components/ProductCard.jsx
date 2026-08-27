import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { addToCart }     from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { useCart }       from "../context/CartContext";
import { useCurrency }   from "../context/CurrencyContext";
import { BASE_URL }      from "../services/api";
import "../styles/productcard.css";

const ProductCard = ({ product }) => {
  const { t }             = useTranslation();
  const { loadCartCount } = useCart();
  const { formatPrice }   = useCurrency();

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
  const imgSrc   = product.image?.startsWith("http")
    ? product.image
    : `${BASE_URL}${product.image}`;

  const stockText = product.stock === 0
    ? t("product.outOfStock")
    : product.stock <= 9
      ? t("product.lowStock", { count: product.stock })
      : t("product.inStock");

  const stockCls = product.stock === 0
    ? "stock-badge--out"
    : "stock-badge--low";

  return (
    <div className="product-card">

      <div className="discount-badge">-20%</div>

      {product.stock <= 9 && (
        <div className={`stock-badge ${stockCls}`}>
          {product.stock === 0 ? t("product.outOfStock") : "Low Stock"}
        </div>
      )}

      <button className="wishlist-btn" onClick={handleWishlist}
        aria-label={t("product.addToWishlist")} type="button">
        <FaHeart />
      </button>

      <Link to={`/product/${product._id}`} className="product-image">
        <img
          src={imgSrc}
          alt={product.name}
          onError={(e) => { e.target.style.opacity = "0.3"; }}
          style={!inStock ? { opacity: 0.45, filter: "grayscale(40%)" } : undefined}
        />
        <span className="quick-view">{t("product.quickView")}</span>
      </Link>

      <div className="product-info">
        <span className="brand">{product.brand}</span>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>

        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} size={12}
              color={i < Math.round(product.rating) ? "#F59E0B" : "#E2E8F0"} />
          ))}
          <span>({product.numReviews || 0})</span>
        </div>

        <div className="price-box">
          <span className="new-price">{formatPrice(product.price)}</span>
          <span className="old-price">{formatPrice(oldPrice)}</span>
        </div>

        <div className={`stock ${inStock ? "in-stock" : "out-stock"}`} style={{ fontSize: 12 }}>
          {stockText}
        </div>

        <button className="cart-btn" disabled={!inStock}
          onClick={handleAddCart} type="button">
          <FaShoppingCart size={13} />
          {inStock ? t("product.addToCart") : t("product.outOfStock")}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
