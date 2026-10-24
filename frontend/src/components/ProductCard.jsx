import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { addToCart }     from "../services/cartService";
import { useCart }       from "../context/CartContext";
import { useCurrency }   from "../context/CurrencyContext";
import { handleImageError, resolveImageUrl, optimizeCloudinaryUrl } from "../utils/imageFallback";
import { getDiscount } from "../utils/pricing";
import "../styles/productcard.css";

const ProductCard = ({ product, badgeType }) => {
  const { t }             = useTranslation();
  const navigate          = useNavigate();
  const location          = useLocation();
  const { loadCartCount } = useCart();
  const { formatPrice }   = useCurrency();

  const checkAuth = (actionType = "cart") => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch {}
    const token = user?.token || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.info("Please create an account to add items to your cart");
      navigate("/register", { state: { from: location.pathname, pendingProductId: product?._id } });
      return false;
    }
    return true;
  };

  const handleAddCart = async () => {
    if (!checkAuth("cart")) return;
    try {
      await addToCart(product._id, 1);
      await loadCartCount();
      toast.success(t("cart.added") || "Added to cart!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const { hasDiscount, oldPrice, percent } = getDiscount(product);
  const inStock  = product.stock > 0;
  const rawSrc   = resolveImageUrl(product.image, "product");
  const imgSrc   = optimizeCloudinaryUrl(rawSrc, "f_auto,q_auto,w_600");

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

      {badgeType === "new" ? (
        <div className="new-badge">✨ NEW</div>
      ) : hasDiscount ? (
        badgeType === "deals" ? (
          <div className="discount-badge discount-badge--hot">🔥 -{percent}% HOT</div>
        ) : (
          <div className="discount-badge">-{percent}%</div>
        )
      ) : null}

      {product.stock <= 9 && (
        <div className={`stock-badge ${stockCls}`}>
          {product.stock === 0 ? t("product.outOfStock") : "Low Stock"}
        </div>
      )}

      <Link to={`/product/${product._id}`} className="product-image">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          width="300"
          height="300"
          onError={(e) => handleImageError(e, "product")}
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
          {hasDiscount && <span className="old-price">{formatPrice(oldPrice)}</span>}
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
