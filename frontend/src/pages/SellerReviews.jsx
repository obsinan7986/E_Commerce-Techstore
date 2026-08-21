/**
 * Seller — My Product Reviews  /seller/reviews
 * Read-only view of all reviews on the seller's own products.
 * Cannot modify or delete customer reviews.
 */
import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { getSellerReviews } from "../services/adminservice";
import { BASE_URL } from "../services/api";
import "../styles/sellerReviews.css";

const Stars = ({ rating }) => (
  <span className="sr-stars">
    {[1,2,3,4,5].map((n) => (
      <FaStar key={n} size={12} color={n <= Math.round(rating) ? "#F59E0B" : "#E2E8F0"} />
    ))}
  </span>
);

const imgSrc = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
};

const SellerReviews = () => {
  const [reviews,  setReviews]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Filters
  const [rating,   setRating]   = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSellerReviews({ page, limit: 15, rating });
      setReviews(res.reviews || []);
      setTotal(res.total    || 0);
      setPages(res.pages    || 1);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, rating]);

  const fmt = (n) => Number(n || 0).toFixed(1);

  return (
    <div className="sd-page sr-page">

      {/* Header */}
      <div className="sd-header">
        <div>
          <h1>My Product Reviews</h1>
          <p>Customer feedback on your products — read-only</p>
        </div>
        <button className="sd-btn sd-btn--ghost" onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="sr-stats">
          <div className="sr-stat">
            <strong>{stats.totalReviews}</strong>
            <span>Total Reviews</span>
          </div>
          <div className="sr-stat">
            <strong>{fmt(stats.avgRating)} ★</strong>
            <span>Average Rating</span>
          </div>
          {/* Breakdown */}
          <div className="sr-breakdown">
            {(stats.breakdown || []).map(({ star, count }) => {
              const max = Math.max(...(stats.breakdown || []).map(b => b.count), 1);
              return (
                <div className="sr-bd-row" key={star}>
                  <span>{star}★</span>
                  <div className="sr-bd-track">
                    <div className="sr-bd-fill" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="sd-filters" style={{ marginBottom: 16 }}>
        <select className="sd-select" value={rating}
          onChange={(e) => { setRating(e.target.value); setPage(1); }}>
          <option value="">All ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
      </div>

      {error && <div className="sd-alert">{error}</div>}

      {loading ? (
        <div className="sd-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="sd-empty">
          <span>⭐</span>
          <p>No reviews yet for your products.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
            {total} review{total !== 1 ? "s" : ""}
          </p>

          <div className="sr-list">
            {reviews.map((r) => (
              <div className="sr-card" key={r._id}>
                {/* Product */}
                <div className="sr-product">
                  {r.product?.image && (
                    <img src={imgSrc(r.product.image)} alt={r.product?.name}
                      className="sr-product-img"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  <span className="sr-product-name">{r.product?.name || "—"}</span>
                </div>

                {/* Rating + meta */}
                <div className="sr-meta">
                  <Stars rating={r.rating} />
                  {r.verifiedPurchase && (
                    <span className="sr-verified">✓ Verified Purchase</span>
                  )}
                  <span className="sr-date">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </span>
                </div>

                {/* Customer */}
                <div className="sr-customer">
                  <div className="sr-avatar">
                    {(r.user?.fullName || "?").charAt(0).toUpperCase()}
                  </div>
                  <span>{r.user?.fullName || "Anonymous"}</span>
                </div>

                {/* Content */}
                {r.title && <p className="sr-title">{r.title}</p>}
                <p className="sr-comment">{r.comment}</p>

                {/* Read-only notice */}
                <p className="sr-readonly-note">
                  Seller view — read-only. Contact admin to report inappropriate reviews.
                </p>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="sd-pagination">
              <button className="sd-btn sd-btn--ghost" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button className="sd-btn sd-btn--ghost" disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerReviews;
