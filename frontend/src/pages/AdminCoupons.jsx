/**
 * Admin Coupon Management
 * Full CRUD — create, list, edit, delete, toggle active
 */
import { useCallback, useEffect, useState } from "react";
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "../services/couponService";
import "../styles/adminCoupons.css";

/* ── Helpers ── */
const fmt    = (n) => Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—";
const isExpired = (d) => d && new Date(d) < new Date();

const EMPTY_FORM = {
  code: "", description: "", type: "percentage", discount: "",
  minOrderAmount: "", expiresAt: "", usageLimit: "", isFirstOrderOnly: false, isActive: true,
};

/* ── Status badge ── */
const CouponStatus = ({ coupon }) => {
  if (!coupon.isActive)         return <span className="acp-badge acp-badge--inactive">Inactive</span>;
  if (isExpired(coupon.expiresAt)) return <span className="acp-badge acp-badge--expired">Expired</span>;
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    return <span className="acp-badge acp-badge--used">Limit Reached</span>;
  return <span className="acp-badge acp-badge--active">Active</span>;
};

/* ── Modal form ── */
const CouponForm = ({ initial, onSave, onClose, loading, error }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{initial?.code ? "Edit Coupon" : "Create Coupon"}</h2>
            <p>Fill in the details below</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="admin-feedback admin-feedback--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div className="form-group acp-full">
              <label>Coupon Code *</label>
              <input type="text" value={form.code} maxLength={30}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20" required style={{ fontWeight: 700, letterSpacing: 1 }} />
            </div>

            <div className="form-group acp-full">
              <label>Description</label>
              <input type="text" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short description shown to admins" />
            </div>

            <div className="form-group">
              <label>Discount Type *</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (ETB)</option>
              </select>
            </div>

            <div className="form-group">
              <label>{form.type === "percentage" ? "Discount % *" : "Discount ETB *"}</label>
              <input type="number" value={form.discount} min={1}
                max={form.type === "percentage" ? 100 : undefined}
                onChange={(e) => set("discount", e.target.value)} placeholder="e.g. 10" required />
            </div>

            <div className="form-group">
              <label>Min. Order (ETB)</label>
              <input type="number" value={form.minOrderAmount} min={0}
                onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0 = no minimum" />
            </div>

            <div className="form-group">
              <label>Usage Limit</label>
              <input type="number" value={form.usageLimit} min={0}
                onChange={(e) => set("usageLimit", e.target.value)} placeholder="0 = unlimited" />
            </div>

            <div className="form-group">
              <label>Expires At *</label>
              <input type="date" value={form.expiresAt ? form.expiresAt.slice(0, 10) : ""}
                onChange={(e) => set("expiresAt", e.target.value)} required />
            </div>

            <div className="form-group" style={{ justifyContent: "center" }}>
              <label style={{ marginBottom: 8 }}>Status</label>
              <label className="acp-check-label">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)} />
                Active
              </label>
              <label className="acp-check-label" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={form.isFirstOrderOnly}
                  onChange={(e) => set("isFirstOrderOnly", e.target.checked)} />
                First order only
              </label>
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              {loading ? "Saving…" : initial?.code ? "Update Coupon" : "Create Coupon"}
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const AdminCoupons = () => {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);    // coupon being edited
  const [formLoad, setFormLoad] = useState(false);
  const [formErr,  setFormErr]  = useState("");

  const [msg,      setMsg]      = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminCoupons({ keyword: search });
      setCoupons(data.coupons || []);
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormErr(""); setShowForm(true); };
  const openEdit   = (c) => {
    setEditing({
      ...c,
      expiresAt:      c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      discount:       String(c.discount),
      minOrderAmount: String(c.minOrderAmount || 0),
      usageLimit:     String(c.usageLimit || 0),
    });
    setFormErr("");
    setShowForm(true);
  };

  const handleSave = async (form) => {
    try {
      setFormLoad(true);
      setFormErr("");
      const payload = {
        code:             form.code.trim().toUpperCase(),
        description:      form.description.trim(),
        type:             form.type,
        discount:         Number(form.discount),
        minOrderAmount:   Number(form.minOrderAmount || 0),
        usageLimit:       Number(form.usageLimit || 0),
        expiresAt:        form.expiresAt,
        isFirstOrderOnly: form.isFirstOrderOnly,
        isActive:         form.isActive,
      };

      if (editing?._id) {
        await updateAdminCoupon(editing._id, payload);
        flash("success", "Coupon updated.");
      } else {
        await createAdminCoupon(payload);
        flash("success", "Coupon created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Save failed.");
    } finally {
      setFormLoad(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await updateAdminCoupon(coupon._id, { isActive: !coupon.isActive });
      flash("success", `Coupon ${coupon.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to toggle.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;
    try {
      await deleteAdminCoupon(id);
      flash("success", "Coupon deleted.");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Coupon Management</h1>
          <p>{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
        </div>
        <button className="refresh-btn" onClick={openCreate}>+ Create Coupon</button>
      </div>

      {msg.text && (
        <div className={`admin-feedback admin-feedback--${msg.type}`}>{msg.text}</div>
      )}

      {/* Search */}
      <div className="admin-filters">
        <input className="admin-search" type="text" placeholder="Search by code…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button className="admin-btn admin-btn-secondary" style={{ height: 40 }}
            onClick={() => setSearch("")}>Clear</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className="acp-empty">
          <span>🏷️</span>
          <p>No coupons found. Create one to get started.</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table acp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="acp-code-cell">
                      <span className="acp-code">{c.code}</span>
                      {c.isFirstOrderOnly && (
                        <span className="acp-first-badge">1st order</span>
                      )}
                      {c.description && <small>{c.description}</small>}
                    </div>
                  </td>
                  <td>
                    <span className={`acp-type-badge acp-type-badge--${c.type}`}>
                      {c.type === "percentage" ? "%" : "ETB"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: "#2563EB" }}>
                    {c.type === "percentage" ? `${c.discount}%` : `ETB ${fmt(c.discount)}`}
                  </td>
                  <td>{c.minOrderAmount > 0 ? `ETB ${fmt(c.minOrderAmount)}` : "—"}</td>
                  <td>
                    <span className="acp-usage">
                      {c.usedCount}
                      {c.usageLimit > 0 ? ` / ${c.usageLimit}` : " / ∞"}
                    </span>
                  </td>
                  <td className={isExpired(c.expiresAt) ? "acp-expired-date" : ""}>
                    {fmtDate(c.expiresAt)}
                  </td>
                  <td><CouponStatus coupon={c} /></td>
                  <td>
                    <div className="acp-actions">
                      <button className="admin-btn-sm-primary" onClick={() => openEdit(c)}>Edit</button>
                      <button
                        className={`admin-btn-sm-${c.isActive ? "danger" : "primary"}`}
                        style={{ background: c.isActive ? "#F59E0B" : "#10B981", fontSize: 11 }}
                        onClick={() => handleToggle(c)}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button className="admin-btn-sm-danger" onClick={() => handleDelete(c._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CouponForm
          initial={editing}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          loading={formLoad}
          error={formErr}
        />
      )}
    </div>
  );
};

export default AdminCoupons;
