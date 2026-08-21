/**
 * Admin — Reviews Management  /admin/reviews
 * View all reviews, filter/search, delete inappropriate ones, see stats
 */
import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import {
  getAdminReviews,
  getAdminReviewStats,
  deleteAdminReview,
} from "../services/adminservice";
import { BASE_URL } from "../services/api";
import "../styles/adminReviews.css";

const Stars = ({ rating }) => (
  <span className="ar-stars">
    {[1,2,3,4,5].map((n) => (
      <FaStar key={n} size={12} color={n <= Math.round(rating) ? "#F59E0B" : "#E2E8F0"} />
    ))}
  </span>
);

const imgSrc = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
};

const AdminReviews = () => {
  const [reviews,  setReviews]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(null);

  // Filters
  const [keyword,  setKeyword]  = useState("");
  const [rating,   setRating]   = useState("");
  const [verified, setVerified] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [rv, st] = await Promise.all([
        getAdminReviews({ page, limit: 15, keyword, rating, verified }),
        stats ? null : getAdminReviewStats(),
      ]);
      setReviews(rv.reviews || []);
      setTotal(rv.total   || 0);
      setPages(rv.pages   || 1);
      if (st) setStats(st.stats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, keyword, rating, verified]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this review? This cannot be undone.")) return;
    try {
      setDeleting(id);
      await deleteAdminReview(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (n) => Number(n || 0).toFixed(1);

  return (
    <div className="admin-page ar-page">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Reviews Management</h1>
          <p>View, search and moderate customer reviews</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="ar-stats">
          <div className="ar-stat">
            <span className="ar-stat-icon">⭐</span>
            <div>
              <strong>{stats.totalReviews}</strong>
              <span>Total Reviews</span>
            </div>
          </div>
          <div className="ar-stat">
            <span className="ar-stat-icon">📊</span>
            <div>
              <strong>{fmt(stats.avgRating)} / 5</strong>
              <span>Average Rating</span>
            </div>
          </div>
          {/* Breakdown bars */}
          <div className="ar-breakdown">
            {(stats.breakdown || []).map(({ star, count }) => {
              const max = Math.max(...(stats.breakdown || []).map(b => b.count), 1);
              return (
                <div className="ar-bd-row" key={star}>
                  <span>{star}★</span>
                  <div className="ar-bd-track">
                    <div className="ar-bd-fill" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ar-filters">
        <input
          className="ar-input"
          placeholder="Search product name or customer…"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
        />
        <select className="ar-select" value={rating}
          onChange={(e) => { setRating(e.target.value); setPage(1); }}>
          <option value="">All ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <select className="ar-select" value={verified}
          onChange={(e) => { setVerified(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="true">Verified purchase</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {error && <div className="ar-alert">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="ar-empty"><span>⭐</span><p>No reviews found.</p></div>
      ) : (
        <>
          <p className="ar-count">{total} review{total !== 1 ? "s" : ""}</p>
          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="ar-product-cell">
                        {r.product?.image && (
                          <img src={imgSrc(r.product.image)} alt={r.product?.name}
                            className="ar-product-img"
                            onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                        <span>{r.product?.name || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ar-user-cell">
                        <strong>{r.user?.fullName || "—"}</strong>
                        <span>{r.user?.email || ""}</span>
                      </div>
                    </td>
                    <td><Stars rating={r.rating} /></td>
                    <td>
                      <div className="ar-review-cell">
                        {r.title && <strong>{r.title}</strong>}
                        <span>{r.comment?.slice(0, 100)}{r.comment?.length > 100 ? "…" : ""}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`ar-badge ${r.verifiedPurchase ? "ar-badge--verified" : "ar-badge--unverified"}`}>
                        {r.verifiedPurchase ? "✓ Verified" : "Unverified"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="ar-del-btn"
                        onClick={() => handleDelete(r._id)}
                        disabled={deleting === r._id}
                      >
                        {deleting === r._id ? "…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="ar-pagination">
              <button disabled={page <= 1}    onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Top/Bottom products from stats */}
      {stats && (
        <div className="ar-products-row">
          {[
            { title: "🏆 Highest Rated",   list: stats.topRated },
            { title: "⚠ Lowest Rated",     list: stats.bottomRated },
            { title: "💬 Most Reviewed",   list: stats.mostReviewed },
          ].map(({ title, list }) => (
            <div className="ar-products-card" key={title}>
              <h3>{title}</h3>
              {(list || []).map(p => (
                <div className="ar-prod-row" key={p._id}>
                  {p.image && (
                    <img src={imgSrc(p.image)} alt={p.name} className="ar-prod-img"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  <div className="ar-prod-info">
                    <span>{p.name}</span>
                    <Stars rating={p.rating} />
                    <small>{p.numReviews} review{p.numReviews !== 1 ? "s" : ""}</small>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
