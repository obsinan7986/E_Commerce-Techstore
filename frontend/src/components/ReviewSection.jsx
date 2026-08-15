/**
 * ReviewSection
 * - Average rating + star breakdown bar chart
 * - Write review form (only verified purchasers)
 * - Paginated review list with edit/delete for owner
 * - Admin can delete any review
 */
import { useCallback, useEffect, useState } from "react";
import { Link }                              from "react-router-dom";
import { FaStar }                            from "react-icons/fa";
import { useAuth }                           from "../context/AuthContext";
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  checkCanReview,
} from "../services/reviewService";
import "../styles/ReviewSection.css";

/* ── Star display helper ── */
const Stars = ({ rating, size = 15 }) => (
  <div className="rv-card-stars" aria-label={`${rating} out of 5 stars`}>
    {[1,2,3,4,5].map((n) => (
      <FaStar key={n} size={size} color={n <= Math.round(rating) ? "#F59E0B" : "#E2E8F0"} />
    ))}
  </div>
);

/* ── Interactive star picker ── */
const StarPicker = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="rv-star-picker" role="radiogroup" aria-label="Star rating">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rv-star-btn${(hovered || value) >= n ? " active" : ""}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

/* ── Review form ── */
const ReviewForm = ({ productId, existing, onDone, onCancel }) => {
  const [rating,  setRating]  = useState(existing?.rating  || 0);
  const [title,   setTitle]   = useState(existing?.title   || "");
  const [comment, setComment] = useState(existing?.comment || "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)          { setMsg({ type: "error", text: "Please select a star rating." }); return; }
    if (!comment.trim())  { setMsg({ type: "error", text: "Please write a comment." }); return; }

    try {
      setLoading(true);
      setMsg({ type: "", text: "" });
      if (existing) {
        await updateReview(existing._id, { rating, title, comment });
      } else {
        await createReview({ productId, rating, title, comment });
      }
      setMsg({ type: "success", text: existing ? "Review updated!" : "Review submitted!" });
      setTimeout(() => onDone(), 800);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rv-form-wrap">
      <h3>{existing ? "Edit Your Review" : "Write a Review"}</h3>
      <form onSubmit={handleSubmit}>
        <StarPicker value={rating} onChange={setRating} />
        <div className="rv-form-field">
          <label>Title (optional)</label>
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarise your experience"
          />
        </div>
        <div className="rv-form-field">
          <label>Your Review *</label>
          <textarea
            rows={4}
            value={comment}
            maxLength={2000}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? How does it compare to similar products?"
          />
        </div>
        {msg.text && <div className={`rv-form-msg rv-form-msg--${msg.type}`}>{msg.text}</div>}
        <div className="rv-form-actions">
          <button type="submit" className="rv-submit-btn" disabled={loading}>
            {loading ? "Submitting…" : existing ? "Update Review" : "Submit Review"}
          </button>
          <button type="button" className="rv-cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

/* ── Main component ── */
const ReviewSection = ({ productId }) => {
  const { user, isAdmin } = useAuth();

  const [reviews,       setReviews]       = useState([]);
  const [breakdown,     setBreakdown]     = useState([]);
  const [avgRating,     setAvgRating]     = useState(0);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [pages,         setPages]         = useState(1);
  const [sort,          setSort]          = useState("newest");
  const [loading,       setLoading]       = useState(true);

  // Review eligibility
  const [canReview,     setCanReview]     = useState(false);
  const [hasPurchased,  setHasPurchased]  = useState(false);
  const [myReview,      setMyReview]      = useState(null);

  // UI state
  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null); // review being edited
  const [deletingId,    setDeletingId]    = useState(null);

  /* ── Load reviews ── */
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReviews(productId, { page, sort, limit: 8 });
      setReviews(data.reviews || []);
      setBreakdown(data.ratingBreakdown || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      // Compute average from breakdown
      const totalVotes   = (data.ratingBreakdown || []).reduce((s, r) => s + r.count, 0);
      const weightedSum  = (data.ratingBreakdown || []).reduce((s, r) => s + r.star * r.count, 0);
      setAvgRating(totalVotes > 0 ? weightedSum / totalVotes : 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [productId, page, sort]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  /* ── Check can review ── */
  useEffect(() => {
    if (!user) return;
    checkCanReview(productId)
      .then((d) => {
        setCanReview(d.canReview);
        setHasPurchased(d.hasPurchased);
        setMyReview(d.existingReview);
      })
      .catch(() => {});
  }, [user, productId]);

  /* ── Delete review ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      setDeletingId(id);
      await deleteReview(id);
      await loadReviews();
      // Refresh eligibility
      if (user) {
        const d = await checkCanReview(productId);
        setCanReview(d.canReview);
        setMyReview(d.existingReview);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDone = async () => {
    setShowForm(false);
    setEditTarget(null);
    await loadReviews();
    if (user) {
      const d = await checkCanReview(productId);
      setCanReview(d.canReview);
      setMyReview(d.existingReview);
    }
  };

  const maxBreakdownCount = Math.max(...breakdown.map((b) => b.count), 1);

  /* ── Render ── */
  return (
    <section className="review-section">
      <h2 className="review-section-title">Customer Reviews</h2>

      {/* ── Rating summary ── */}
      {total > 0 && (
        <div className="rv-summary">
          {/* Average */}
          <div className="rv-avg-block">
            <span className="rv-avg-num">{avgRating.toFixed(1)}</span>
            <Stars rating={avgRating} size={18} />
            <span className="rv-avg-count">{total} review{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Bar breakdown */}
          <div className="rv-breakdown">
            {breakdown.map(({ star, count }) => (
              <div className="rv-bar-row" key={star}>
                <span className="rv-bar-label">
                  {star} <FaStar size={11} color="#F59E0B" />
                </span>
                <div className="rv-bar-track">
                  <div
                    className="rv-bar-fill"
                    style={{ width: `${(count / maxBreakdownCount) * 100}%` }}
                  />
                </div>
                <span className="rv-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Write review banner / button ── */}
      {!user && (
        <div className="rv-login-banner">
          <Link to="/login">Sign in</Link> to write a review.
        </div>
      )}

      {user && hasPurchased && canReview && !showForm && !editTarget && (
        <div className="rv-toolbar" style={{ justifyContent: "flex-end" }}>
          <button className="rv-write-btn" onClick={() => setShowForm(true)}>
            ✍ Write a Review
          </button>
        </div>
      )}

      {user && hasPurchased && !canReview && !myReview && (
        <div className="rv-no-purchase">You have already reviewed this product.</div>
      )}

      {user && !hasPurchased && (
        <div className="rv-no-purchase">
          Only customers who purchased this product can leave a review.
        </div>
      )}

      {/* ── Review form (write) ── */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onDone={handleDone}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Edit form ── */}
      {editTarget && (
        <ReviewForm
          productId={productId}
          existing={editTarget}
          onDone={handleDone}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {/* ── Sort bar ── */}
      {total > 0 && (
        <div className="rv-toolbar">
          <span style={{ fontSize: 13, color: "var(--text-muted, #9CA3AF)" }}>
            {total} review{total !== 1 ? "s" : ""}
          </span>
          <select
            className="rv-sort-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            <option value="newest">Newest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>
      )}

      {/* ── Review list ── */}
      {loading ? (
        <div className="rv-loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="rv-empty">
          <span className="rv-empty-icon">⭐</span>
          No reviews yet. Be the first to share your experience!
        </div>
      ) : (
        <>
          <div className="rv-list">
            {reviews.map((r) => {
              const isOwner  = user && r.user?._id?.toString() === user._id?.toString();
              const isEditing = editTarget?._id === r._id;

              return (
                <div className="rv-card" key={r._id}>
                  <div className="rv-card-header">
                    <div className="rv-card-left">
                      <div className="rv-card-author">
                        <div className="rv-author-avatar">
                          {(r.user?.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="rv-author-name">{r.user?.fullName || "Anonymous"}</span>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <div className="rv-card-badges">
                      {r.verifiedPurchase && (
                        <span className="rv-verified-badge">✓ Verified Purchase</span>
                      )}
                      {isAdmin && !isOwner && (
                        <span className="rv-admin-badge">Admin</span>
                      )}
                      <span className="rv-date">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      </span>
                    </div>
                  </div>

                  {r.title && <p className="rv-card-title">{r.title}</p>}
                  <p className="rv-card-comment">{r.comment}</p>

                  {/* Owner / admin actions */}
                  {(isOwner || isAdmin) && !isEditing && (
                    <div className="rv-card-actions">
                      {isOwner && (
                        <button
                          className="rv-edit-btn"
                          onClick={() => { setEditTarget(r); setShowForm(false); }}
                        >
                          ✏ Edit
                        </button>
                      )}
                      <button
                        className="rv-delete-btn"
                        onClick={() => handleDelete(r._id)}
                        disabled={deletingId === r._id}
                      >
                        {deletingId === r._id ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="rv-pagination">
              <button disabled={page <= 1}   onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ReviewSection;
