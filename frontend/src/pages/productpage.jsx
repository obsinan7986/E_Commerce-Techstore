import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaShoppingCart, FaHeart, FaStar, FaMinus, FaPlus } from "react-icons/fa";

import api from "../services/api";
import ProductGallery from "../components/ProductGallery";
import RelatedProducts from "../components/RelatedProducts";
import ReviewSection from "../components/ReviewSection";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { useCart } from "../context/CartContext";

import "../styles/productpage.css";

const ProductPage = () => {
  const { id } = useParams();
  const { loadCartCount } = useCart();
  const [product, setProduct]   = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product || data))
      .catch(console.error)
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { alert("Please login first."); return; }
    try {
      await addToCart(product._id, quantity);
      await loadCartCount();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart.");
    }
  };

  const handleWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { alert("Please login first."); return; }
    try {
      await addToWishlist(product._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to wishlist.");
    }
  };

  if (loading) {
    return (
      <div className="product-page-wrapper">
        <div className="product-page-loading ts-loading">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page-wrapper">
        <div className="ts-empty">
          <span className="ts-empty-icon">🔍</span>
          <h3>Product not found</h3>
          <Link to="/products" className="btn-primary" style={{ marginTop: 8 }}>Browse Products</Link>
        </div>
      </div>
    );
  }

  const oldPrice    = Math.round(product.price * 1.2);
  const inStock     = product.stock > 0;
  const discountPct = 20;

  return (
    <>
      <div className="product-page-wrapper">
        {/* Breadcrumb */}
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/products">Products</Link>
          <span>›</span>
          <Link to={`/category/${product.category}`}>{product.category}</Link>
          <span>›</span>
          <span style={{ color: "var(--text-secondary)" }}>{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="product-page">

          {/* Gallery */}
          <div className="product-left">
            <ProductGallery product={product} />
          </div>

          {/* Info */}
          <div className="product-right">
            <h1>{product.name}</h1>

            {/* Rating */}
            <div className="product-rating">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < Math.round(product.rating) ? "#F59E0B" : "#E2E8F0"} size={16} />
              ))}
              <span>({product.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="price-box">
              <span className="new-price">ETB {product.price.toLocaleString()}</span>
              <span className="old-price">ETB {oldPrice.toLocaleString()}</span>
              <span className="discount">-{discountPct}%</span>
            </div>

            {/* Meta */}
            <div className="product-meta">
              <div className="product-meta-row">
                <span className="meta-label">Brand</span>
                <span className="meta-value">{product.brand}</span>
              </div>
              <div className="product-meta-row">
                <span className="meta-label">Category</span>
                <span className="meta-value">{product.category}</span>
              </div>
              <div className="product-meta-row">
                <span className="meta-label">Availability</span>
                <span className={inStock ? "meta-in-stock" : "meta-out-stock"}>
                  {inStock ? `✓ In Stock (${product.stock} left)` : "✗ Out of Stock"}
                </span>
              </div>
              <div className="product-meta-row">
                <span className="meta-label">Shipping</span>
                <span className="meta-free-ship">🚚 Free Shipping</span>
              </div>
            </div>

            {/* Quantity */}
            {inStock && (
              <>
                <div className="qty-label">Quantity</div>
                <div className="quantity-box">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease">
                    <FaMinus size={11} />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} aria-label="Increase">
                    <FaPlus size={11} />
                  </button>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="action-buttons">
              <button className="cart-button" onClick={handleAddToCart} disabled={!inStock}>
                <FaShoppingCart size={16} />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
              <button className="wishlist-button" onClick={handleWishlist} aria-label="Add to wishlist">
                <FaHeart size={15} /> Wishlist
              </button>
            </div>

            {/* Description */}
            <div className="description">
              <h2>Description</h2>
              <p>{product.description}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Related & Reviews */}
      <div className="product-below">
        <RelatedProducts productId={product._id} />
        <ReviewSection productId={product._id} />
      </div>
    </>
  );
};

export default ProductPage;
