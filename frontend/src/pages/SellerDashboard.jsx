/**
 * Seller Dashboard — /seller/dashboard
 * Manage own products (add/edit/delete), view approval status, view sales summary
 */
import { useEffect, useRef, useState } from "react";
import api, { BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/sellerDashboard.css";

const CATEGORIES = ["Smartphones","Laptops","Tablets","Accessories","Gaming","Headphones","Speakers","Cameras","Televisions","Smartwatches"];

const STATUS_LABEL = { pending: "Pending Review", approved: "Approved", rejected: "Rejected" };
const STATUS_CLS   = { pending: "ps--pending", approved: "ps--approved", rejected: "ps--rejected" };

const EMPTY_FORM = { name: "", description: "", brand: "", category: "Smartphones", image: "", price: "", stock: "" };

const SellerDashboard = () => {
  const { user } = useAuth();

  // ── KYC gate state ───────────────────────────────────────
  const [kycStatus, setKycStatus] = useState(user?.kycStatus || "not_submitted");
  const [kycLoading, setKycLoading] = useState(false);

  // ── Products list ────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  // ── Sales summary ────────────────────────────────────────
  const [sales,     setSales]     = useState(null);

  // ── Product modal ────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState("");
  const fileRef = useRef(null);

  const [confirmId, setConfirmId] = useState(null);

  // ── Load products ────────────────────────────────────────
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filterStatus) params.approvalStatus = filterStatus;
      const { data } = await api.get("/seller/products", { params });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const { data } = await api.get("/seller/sales");
      setSales(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadProducts();
    loadSales();
  }, [page, filterStatus]);

  // ── Image upload ─────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image: data.image }));
    } catch {
      setFormErr("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Open modals ──────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setPreview(""); setFormErr(""); setShowModal(true);
  };
  const openEdit = (p) => {
    setEditId(p._id);
    setForm({ name: p.name, description: p.description, brand: p.brand, category: p.category,
      image: p.image, price: String(p.price), stock: String(p.stock) });
    setPreview(p.image ? `${BASE_URL}${p.image}` : "");
    setFormErr(""); setShowModal(true);
  };
  const closeModal = () => { if (saving || uploading) return; setShowModal(false); };

  // ── Save product ─────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.name || !form.description || !form.brand || !form.price)
      return setFormErr("Name, description, brand and price are required.");
    try {
      setSaving(true);
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 };
      if (editId) await api.put(`/seller/products/${editId}`, payload);
      else        await api.post("/seller/products", payload);
      closeModal();
      await loadProducts();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete product ───────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/seller/products/${id}`);
      setConfirmId(null);
      await loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  // ── KYC pending / not submitted state ───────────────────
  if (kycStatus !== "verified") {
    return (
      <div className="sd-page">
        <div className="sd-kyc-gate">
          {kycStatus === "not_submitted" && (
            <>
              <span className="sd-gate-icon">🪪</span>
              <h2>KYC Verification Required</h2>
              <p>You need to complete KYC verification before you can list products. Please re-register or contact the owner to get verified.</p>
            </>
          )}
          {kycStatus === "pending" && (
            <>
              <span className="sd-gate-icon">⏳</span>
              <h2>KYC Under Review</h2>
              <p>Your documents have been submitted and are being reviewed. You'll be able to list products once your KYC is approved.</p>
            </>
          )}
          {kycStatus === "rejected" && (
            <>
              <span className="sd-gate-icon">❌</span>
              <h2>KYC Rejected</h2>
              <p>Your KYC was rejected. Please contact support to resubmit your documents.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="sd-page">
      <div className="sd-header">
        <div><h1>Seller Dashboard</h1><p>Welcome, <strong>{user?.fullName}</strong></p></div>
        <button className="sd-btn sd-btn--primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {/* Sales summary */}
      {sales && (
        <div className="sd-sales">
          <div className="sd-sale-card">
            <span>💰</span>
            <div><strong>ETB {fmt(sales.summary?.totalRevenue)}</strong><span>Total Revenue</span></div>
          </div>
          <div className="sd-sale-card">
            <span>📦</span>
            <div><strong>{sales.summary?.totalUnitsSold || 0}</strong><span>Units Sold</span></div>
          </div>
          <div className="sd-sale-card">
            <span>🛒</span>
            <div><strong>{sales.summary?.totalOrders || 0}</strong><span>Orders</span></div>
          </div>
          <Link to="/seller/reviews" className="sd-sale-card" style={{ textDecoration: "none", cursor: "pointer" }}>
            <span>⭐</span>
            <div><strong>My Reviews</strong><span>View customer feedback</span></div>
          </Link>
        </div>
      )}

      {/* Filter */}
      <div className="sd-filters">
        <select className="sd-select" value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Products</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="sd-btn sd-btn--ghost" onClick={loadProducts}>↻ Refresh</button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="sd-loading">Loading…</div>
      ) : products.length === 0 ? (
        <div className="sd-empty">
          <span>📦</span>
          <p>No products yet. Click <strong>+ Add Product</strong> to get started.</p>
        </div>
      ) : (
        <div className="sd-product-list">
          {products.map((p) => (
            <div className="sd-product-card" key={p._id}>
              <div className="sd-product-img">
                {p.image ? <img src={`${BASE_URL}${p.image}`} alt={p.name} onError={(e) => { e.target.style.opacity = "0.3"; }} /> : <span>📷</span>}
              </div>
              <div className="sd-product-info">
                <div className="sd-product-top">
                  <span className={`ps-badge ${STATUS_CLS[p.approvalStatus]}`}>{STATUS_LABEL[p.approvalStatus]}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="sd-product-meta">{p.brand} · {p.category} · ETB {fmt(p.price)} · Stock: {p.stock}</p>
                {p.approvalStatus === "rejected" && p.rejectionReason && (
                  <div className="sd-rejection">
                    <strong>Rejection reason:</strong> {p.rejectionReason}
                  </div>
                )}
                {p.approvalStatus === "pending" && (
                  <p className="sd-pending-note">Under review. Editing will reset to pending.</p>
                )}
              </div>
              <div className="sd-product-actions">
                <button className="sd-btn sd-btn--edit" onClick={() => openEdit(p)}>Edit</button>
                <button className="sd-btn sd-btn--delete" onClick={() => setConfirmId(p._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="sd-pagination">
          <button className="sd-btn sd-btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>{page} / {pages}</span>
          <button className="sd-btn sd-btn--ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── Product Modal ── */}
      {showModal && (
        <div className="sd-overlay" onClick={closeModal}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
              <button className="sd-modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="sd-form" onSubmit={handleSave} noValidate>
              {formErr && <div className="sd-alert">{formErr}</div>}
              {editId && <div className="sd-notice">Editing will reset approval status to <strong>Pending</strong> for re-review.</div>}

              {/* Image */}
              <div className="sd-field">
                <label>Product Image</label>
                <div className="sd-upload" onClick={() => fileRef.current?.click()}>
                  {preview ? <img src={preview} alt="preview" className="sd-upload-preview" /> :
                    <div className="sd-upload-ph"><span>📤</span><span>Click to upload</span></div>}
                  {uploading && <div className="sd-upload-overlay">Uploading…</div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              </div>

              <div className="sd-form-row">
                <div className="sd-field">
                  <label>Name *</label>
                  <input className="sd-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="sd-field">
                  <label>Brand *</label>
                  <input className="sd-input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required />
                </div>
              </div>
              <div className="sd-field">
                <label>Description *</label>
                <textarea className="sd-input sd-textarea" rows={3} value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="sd-form-row">
                <div className="sd-field">
                  <label>Category *</label>
                  <select className="sd-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Price (ETB) *</label>
                  <input className="sd-input" type="number" min="0.01" step="0.01" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="sd-field">
                  <label>Stock</label>
                  <input className="sd-input" type="number" min="0" value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <div className="sd-modal-footer">
                <button type="button" className="sd-btn sd-btn--ghost" onClick={closeModal} disabled={saving || uploading}>Cancel</button>
                <button type="submit" className="sd-btn sd-btn--primary" disabled={saving || uploading}>
                  {saving ? "Saving…" : editId ? "Update Product" : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmId && (
        <div className="sd-overlay" onClick={() => setConfirmId(null)}>
          <div className="sd-confirm" onClick={(e) => e.stopPropagation()}>
            <span>🗑</span><h3>Delete this product?</h3><p>This cannot be undone.</p>
            <div className="sd-confirm-actions">
              <button className="sd-btn sd-btn--ghost" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="sd-btn sd-btn--delete" onClick={() => handleDelete(confirmId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
