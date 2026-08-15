import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import "../styles/wishlist.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    try {
      setRemoving(id);
      await removeFromWishlist(id);
      setWishlist((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="ts-loading">Loading wishlist…</div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <div>
          <h1>My Wishlist</h1>
          {wishlist.length > 0 && (
            <p>{wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Link to="/products" className="btn-secondary">Continue Shopping</Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <span className="wishlist-empty-icon">🤍</span>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and come back to them any time.</p>
          <Link to="/products" className="btn-primary" style={{ marginTop: 8 }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div className="wishlist-item" key={product._id}>
              <div className="wishlist-item-img">
                <img
                  src={product.image?.startsWith("http") ? product.image : `${BASE}${product.image}`}
                  alt={product.name}
                  onError={(e) => { e.target.src = "/placeholder.png"; }}
                />
              </div>
              <div className="wishlist-item-info">
                <span className="wishlist-item-brand">{product.brand}</span>
                <Link to={`/product/${product._id}`} className="wishlist-item-name">
                  {product.name}
                </Link>
                <span className="wishlist-item-price">ETB {product.price?.toLocaleString()}</span>
                <div className="wishlist-item-actions">
                  <Link to={`/product/${product._id}`} className="wishlist-view-btn">
                    View Details
                  </Link>
                  <button
                    className="wishlist-remove-btn"
                    onClick={() => handleRemove(product._id)}
                    disabled={removing === product._id}
                    aria-label="Remove from wishlist"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
