/**
 * Admin — Product Approval Queue  /admin/product-approvals
 * Review pending seller products: approve or reject with reason
 */
import { useEffect, useState } from "react";
import api, { BASE_URL } from "../services/api";
import "../styles/adminProductApproval.css";

const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const STATUS_CLS   = { pending: "apa--pending", approved: "apa--approved", rejected: "apa--rejected" };

const AdminProductApproval = () => {
  const [products,  setProducts]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filterSt,  setFilterSt]  = useState("pending");

  // Review modal
  const [reviewing, setReviewing]  = useState(null); // product being reviewed
  const [reason,    setReason]     = useState("");
  const [busy,      setBusy]       = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/product-approvals", {
        params: { status: filterSt, page, limit: 12 },
      });
      setProducts(data.products || []);
      setTotal(data.total  || 0);
      setPages(data.pages  || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterSt, page]);

  const handleApprove = async (id) => {
    try {
      setBusy(true);
      await api.patch(`/admin/product-approvals/${id}/approve`);
      setReviewing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id) => {
    if (!reason.trim()) { alert("Please enter a rejection reason."); return; }
    try {
      setBusy(true);
      await api.patch(`/admin/product-approvals/${id}/reject`, { reason });
      setReviewing(null);
      setReason("");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Rejection failed.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="admin-page apa-page">
      <div className="admin-header">
        <div>
          <h1>Product Approvals</h1>
          <p>Review seller-submitted products before they go live</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Status filter tabs */}
      <div className="apa-tabs">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s}
            className={`apa-tab ${filterSt === s ? "apa-tab--active" : ""}`}
            onClick={() => { setFilterSt(s); setPage(1); }}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <div className="apa-alert">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="apa-empty">
          <span>📦</span>
          <p>No {filterSt} products.</p>
        </div>
      ) : (
        <>
          <p className="apa-count">{total} product{total !== 1 ? "s" : ""}</p>
          <div className="apa-grid">
            {products.map((p) => (
              <div className="apa-card" key={p._id}>
                <div className="apa-img">
                  {p.image ? (
                    <img src={p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`}
                      alt={p.name} onError={(e) => { e.target.style.opacity = "0.3"; }} />
                  ) : <span>📷</span>}
                </div>
                <div className="apa-body">
                  <div className="apa-top">
                    <span className={`apa-badge ${STATUS_CLS[p.approvalStatus]}`}>{STATUS_LABEL[p.approvalStatus]}</span>
                    <span className="apa-cat">{p.category}</span>
                  </div>
                  <h3 className="apa-name">{p.name}</h3>
                  <p className="apa-meta">{p.brand} · ETB {fmt(p.price)} · Stock: {p.stock}</p>
                  {p.seller && (
                    <p className="apa-seller">Seller: <strong>{p.seller.fullName}</strong> ({p.seller.email})</p>
                  )}
                  {p.approvalStatus === "rejected" && p.rejectionReason && (
                    <div className="apa-reason">Rejection: {p.rejectionReason}</div>
                  )}
                  <p className="apa-desc">{p.description?.slice(0, 100)}{p.description?.length > 100 ? "…" : ""}</p>
                </div>
                <div className="apa-actions">
                  <button className="apa-btn apa-btn--review" onClick={() => { setReviewing(p); setReason(""); }}>
                    {filterSt === "pending" ? "Review" : "Re-review"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="apa-pagination">
              <button className="apa-btn apa-btn--nav" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button className="apa-btn apa-btn--nav" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Review Modal ── */}
      {reviewing && (
        <div className="apa-overlay" onClick={() => setReviewing(null)}>
          <div className="apa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apa-modal-header">
              <h2>Review: {reviewing.name}</h2>
              <button className="apa-modal-close" onClick={() => setReviewing(null)}>×</button>
            </div>

            {/* Product preview */}
            <div className="apa-preview">
              {reviewing.image && (
                <img
                  src={reviewing.image.startsWith("http") ? reviewing.image : `${BASE_URL}${reviewing.image}`}
                  alt={reviewing.name} className="apa-preview-img"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              <div className="apa-preview-info">
                <p><strong>Brand:</strong> {reviewing.brand}</p>
                <p><strong>Category:</strong> {reviewing.category}</p>
                <p><strong>Price:</strong> ETB {fmt(reviewing.price)}</p>
                <p><strong>Stock:</strong> {reviewing.stock}</p>
                {reviewing.seller && <p><strong>Seller:</strong> {reviewing.seller.fullName} ({reviewing.seller.email})</p>}
                <p style={{ marginTop: 8 }}>{reviewing.description}</p>
              </div>
            </div>

            {/* Rejection reason */}
            <div className="apa-review-form">
              <label className="apa-review-label">
                Rejection reason <span style={{ color: "#9CA3AF" }}>(required to reject)</span>
              </label>
              <textarea className="apa-textarea" rows={3} placeholder="Describe why the product is rejected…"
                value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="apa-modal-footer">
              <button className="apa-btn apa-btn--cancel"  onClick={() => setReviewing(null)}>Cancel</button>
              <button className="apa-btn apa-btn--reject"  onClick={() => handleReject(reviewing._id)}  disabled={busy}>Reject</button>
              <button className="apa-btn apa-btn--approve" onClick={() => handleApprove(reviewing._id)} disabled={busy}>
                {busy ? "Processing…" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductApproval;
