/**
 * Admin — Promotional Banners Management
 * /admin/banners
 *
 * Features:
 *  - List all banners with status badge (live / scheduled / expired / inactive)
 *  - Create banner: upload image via /api/upload, set title, subtitle,
 *    product link, start date, end date, sort order
 *  - Edit any banner in-place via the same modal
 *  - Toggle active / inactive
 *  - Delete with confirmation
 */
import { useEffect, useRef, useState } from "react";
import {
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  toggleAdminBanner,
} from "../services/adminservice";
import api, { BASE_URL } from "../services/api";
import "../styles/adminBanners.css";

/* ── helpers ──────────────────────────────────────────────── */
const toInputDate = (iso) => (iso ? iso.slice(0, 10) : "");

const bannerStatus = (b) => {
  if (!b.isActive) return { label: "Inactive",  cls: "bst--inactive"  };
  const now  = new Date();
  const start = new Date(b.startDate);
  const end   = new Date(b.endDate);
  if (now < start) return { label: "Scheduled", cls: "bst--scheduled" };
  if (now > end)   return { label: "Expired",   cls: "bst--expired"   };
  return              { label: "Live",       cls: "bst--live"      };
};

const imgSrc = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

const EMPTY_FORM = {
  title:       "",
  subtitle:    "",
  image:       "",
  productLink: "/products",
  startDate:   "",
  endDate:     "",
  isActive:    true,
  sortOrder:   0,
};

/* ── Component ────────────────────────────────────────────── */
const AdminBanners = () => {
  const [banners,    setBanners]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");

  const [uploading,  setUploading]  = useState(false);
  const [preview,    setPreview]    = useState("");
  const fileRef = useRef(null);

  const [confirmId,  setConfirmId]  = useState(null);

  /* ── load ──────────────────────────────────────────────── */
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminBanners();
      setBanners(res.banners || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── modal helpers ─────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setPreview("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditTarget(b._id);
    setForm({
      title:       b.title,
      subtitle:    b.subtitle || "",
      image:       b.image,
      productLink: b.productLink || "/products",
      startDate:   toInputDate(b.startDate),
      endDate:     toInputDate(b.endDate),
      isActive:    b.isActive,
      sortOrder:   b.sortOrder ?? 0,
    });
    setPreview(imgSrc(b.image));
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
    setEditTarget(null);
    setPreview("");
    setFormError("");
  };

  /* ── image upload ──────────────────────────────────────── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      setUploading(true);
      setFormError("");
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, image: data.image }));
    } catch (err) {
      setFormError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  /* ── save (create / update) ────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim())   return setFormError("Title is required.");
    if (!form.image)          return setFormError("Please upload a banner image.");
    if (!form.startDate)      return setFormError("Start date is required.");
    if (!form.endDate)        return setFormError("End date is required.");
    if (form.endDate <= form.startDate)
      return setFormError("End date must be after start date.");

    try {
      setSaving(true);
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editTarget) {
        await updateAdminBanner(editTarget, payload);
      } else {
        await createAdminBanner(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle ────────────────────────────────────────────── */
  const handleToggle = async (id) => {
    try {
      await toggleAdminBanner(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Toggle failed.");
    }
  };

  /* ── delete ────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    try {
      await deleteAdminBanner(id);
      setConfirmId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="admin-page ab-page">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Promotional Banners</h1>
          <p>Manage homepage slider banners</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
          <button className="ab-add-btn" onClick={openCreate}>+ New Banner</button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="ab-alert ab-alert--error">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="admin-loading">Loading banners…</div>
      ) : banners.length === 0 ? (
        <div className="ab-empty">
          <span className="ab-empty-icon">🖼</span>
          <p>No banners yet. Click <strong>+ New Banner</strong> to create one.</p>
        </div>
      ) : (
        <div className="ab-list">
          {banners.map((b) => {
            const st = bannerStatus(b);
            return (
              <div className="ab-card" key={b._id}>
                {/* Thumbnail */}
                <div className="ab-thumb">
                  {b.image ? (
                    <img
                      src={imgSrc(b.image)}
                      alt={b.title}
                      onError={(e) => { e.target.style.opacity = "0.3"; }}
                    />
                  ) : (
                    <span className="ab-thumb-placeholder">🖼</span>
                  )}
                </div>

                {/* Info */}
                <div className="ab-info">
                  <div className="ab-info-top">
                    <span className={`ab-status ${st.cls}`}>{st.label}</span>
                    <span className="ab-order">Order #{b.sortOrder}</span>
                  </div>
                  <h3 className="ab-title">{b.title}</h3>
                  {b.subtitle && <p className="ab-subtitle">{b.subtitle}</p>}

                  <div className="ab-meta">
                    <span>🔗 {b.productLink}</span>
                    <span>
                      📅 {new Date(b.startDate).toLocaleDateString()} –{" "}
                      {new Date(b.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="ab-actions">
                  <button
                    className={`ab-btn ab-btn--toggle ${b.isActive ? "ab-btn--on" : "ab-btn--off"}`}
                    onClick={() => handleToggle(b._id)}
                    title={b.isActive ? "Deactivate" : "Activate"}
                  >
                    {b.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    className="ab-btn ab-btn--edit"
                    onClick={() => openEdit(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="ab-btn ab-btn--delete"
                    onClick={() => setConfirmId(b._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────── */}
      {showModal && (
        <div className="ab-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ab-modal-header">
              <h2>{editTarget ? "Edit Banner" : "New Banner"}</h2>
              <button className="ab-modal-close" onClick={closeModal} aria-label="Close">×</button>
            </div>

            <form className="ab-form" onSubmit={handleSave} noValidate>

              {formError && (
                <div className="ab-alert ab-alert--error">{formError}</div>
              )}

              {/* Image upload */}
              <div className="ab-field">
                <label className="ab-label">Banner Image <span className="ab-req">*</span></label>
                <div className="ab-upload-area" onClick={() => fileRef.current?.click()}>
                  {preview ? (
                    <img src={preview} alt="preview" className="ab-upload-preview" />
                  ) : (
                    <div className="ab-upload-placeholder">
                      <span className="ab-upload-icon">📤</span>
                      <span>Click to upload image</span>
                      <span className="ab-upload-hint">PNG, JPG, WEBP</span>
                    </div>
                  )}
                  {uploading && <div className="ab-upload-overlay">Uploading…</div>}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="ab-file-input"
                  onChange={handleFileChange}
                />
                {form.image && !uploading && (
                  <p className="ab-upload-path">{form.image}</p>
                )}
              </div>

              {/* Title */}
              <div className="ab-field">
                <label className="ab-label">Title <span className="ab-req">*</span></label>
                <input
                  className="ab-input"
                  type="text"
                  placeholder="e.g. Summer Sale — Up to 40% Off"
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* Subtitle */}
              <div className="ab-field">
                <label className="ab-label">Subtitle</label>
                <input
                  className="ab-input"
                  type="text"
                  placeholder="e.g. Shop the latest smartphones and laptops"
                  maxLength={160}
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </div>

              {/* Product Link */}
              <div className="ab-field">
                <label className="ab-label">Product Link</label>
                <input
                  className="ab-input"
                  type="text"
                  placeholder="/products  or  /category/Smartphones  or  /product/abc123"
                  value={form.productLink}
                  onChange={(e) => setForm((f) => ({ ...f, productLink: e.target.value }))}
                />
                <span className="ab-hint">Internal path the banner links to when clicked.</span>
              </div>

              {/* Dates */}
              <div className="ab-row">
                <div className="ab-field">
                  <label className="ab-label">Start Date <span className="ab-req">*</span></label>
                  <input
                    className="ab-input"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="ab-field">
                  <label className="ab-label">End Date <span className="ab-req">*</span></label>
                  <input
                    className="ab-input"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Sort order + Active */}
              <div className="ab-row">
                <div className="ab-field">
                  <label className="ab-label">Sort Order</label>
                  <input
                    className="ab-input"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  />
                  <span className="ab-hint">Lower numbers appear first in the slider.</span>
                </div>
                <div className="ab-field ab-field--checkbox">
                  <label className="ab-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                  <span className="ab-hint">Inactive banners are never shown, even within their date range.</span>
                </div>
              </div>

              {/* Footer */}
              <div className="ab-modal-footer">
                <button
                  type="button"
                  className="ab-btn ab-btn--cancel"
                  onClick={closeModal}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ab-btn ab-btn--save"
                  disabled={saving || uploading}
                >
                  {saving ? "Saving…" : editTarget ? "Update Banner" : "Create Banner"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────────── */}
      {confirmId && (
        <div className="ab-overlay" onClick={() => setConfirmId(null)} role="dialog" aria-modal="true">
          <div className="ab-confirm" onClick={(e) => e.stopPropagation()}>
            <span className="ab-confirm-icon">🗑</span>
            <h3>Delete this banner?</h3>
            <p>This cannot be undone.</p>
            <div className="ab-confirm-actions">
              <button className="ab-btn ab-btn--cancel" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button className="ab-btn ab-btn--delete" onClick={() => handleDelete(confirmId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminBanners;
