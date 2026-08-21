/**
 * Announcements Page — /comm/announcements
 * Owner: full CRUD
 * Admin/Finance/Seller: view authorized announcements, mark as read
 */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, markAnnouncementRead, getStaffUsers,
} from "../services/adminservice";
import "../styles/commModule.css";

const PRIORITY_CLS = {
  Urgent: "cm-badge cm-badge--urgent",
  High:   "cm-badge cm-badge--high",
  Normal: "cm-badge cm-badge--normal",
  Low:    "cm-badge cm-badge--low",
};
const PRIORITY_ICON = { Urgent: "🚨", High: "⚠️", Normal: "📢", Low: "ℹ️" };

const CATEGORIES = [
  "Business Update","Product Update","Price Update",
  "Company News","Meeting Notice","Important Notice",
];

const EMPTY_FORM = {
  title: "", content: "", category: "Business Update",
  priority: "Normal", publishDate: "", expirationDate: "",
  targetRoles: [], targetUserIds: [], isPublished: true,
};

const toDateInput = (iso) => iso ? iso.slice(0, 10) : "";

const AnnouncementsPage = () => {
  const { user, isOwner } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [pages,         setPages]         = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showExpired,    setShowExpired]    = useState(false);

  const [staffUsers, setStaffUsers] = useState([]);

  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState("");

  const [detailAnn, setDetailAnn]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 15 };
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (showExpired)    params.includeExpired = "true";
      const res = await getAnnouncements(params);
      setAnnouncements(res.announcements || []);
      setTotal(res.total  || 0);
      setPages(res.pages  || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filterCategory, filterPriority, showExpired]);
  useEffect(() => {
    if (!isOwner) return;
    getStaffUsers().then(r => setStaffUsers(r.users || [])).catch(() => {});
  }, [isOwner]);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setFormErr(""); setShowModal(true);
  };
  const openEdit = (a) => {
    setEditId(a._id);
    setForm({
      title:         a.title,
      content:       a.content,
      category:      a.category,
      priority:      a.priority,
      publishDate:   toDateInput(a.publishDate),
      expirationDate: toDateInput(a.expirationDate),
      targetRoles:   a.targetRoles || [],
      targetUserIds: (a.targetUsers || []).map(u => u._id || u),
      isPublished:   a.isPublished,
    });
    setFormErr(""); setShowModal(true);
  };
  const closeModal = () => { if (saving) return; setShowModal(false); };

  const toggleRole = (r) => setForm(f => ({
    ...f,
    targetRoles: f.targetRoles.includes(r) ? f.targetRoles.filter(x => x !== r) : [...f.targetRoles, r],
  }));
  const toggleUser = (uid) => setForm(f => ({
    ...f,
    targetUserIds: f.targetUserIds.includes(uid) ? f.targetUserIds.filter(x => x !== uid) : [...f.targetUserIds, uid],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.title.trim())   return setFormErr("Title is required.");
    if (!form.content.trim()) return setFormErr("Content is required.");
    try {
      setSaving(true);
      if (editId) await updateAnnouncement(editId, form);
      else        await createAnnouncement(form);
      closeModal();
      await load();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnnouncement(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleRead = async (id) => {
    try {
      await markAnnouncementRead(id);
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
      if (detailAnn?._id === id) setDetailAnn(d => ({ ...d, isRead: true }));
    } catch { /* silent */ }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" }) : null;

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1>📢 Announcements</h1>
          <p>{isOwner ? "Manage internal announcements" : "Company updates and notices"}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="cm-refresh-btn" onClick={load}>↻ Refresh</button>
          {isOwner && (
            <button className="cm-primary-btn" onClick={openCreate}>+ New Announcement</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="cm-filters">
        <select className="cm-select" value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="cm-select" value={filterPriority}
          onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          {["Urgent","High","Normal","Low"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {isOwner && (
          <label className="cm-checkbox-label">
            <input type="checkbox" checked={showExpired}
              onChange={e => { setShowExpired(e.target.checked); setPage(1); }} />
            Include expired
          </label>
        )}
        {(filterCategory || filterPriority) && (
          <button className="cm-clear-btn"
            onClick={() => { setFilterCategory(""); setFilterPriority(""); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="cm-alert cm-alert--error">{error}</div>}

      {loading ? (
        <div className="cm-loading">Loading announcements…</div>
      ) : announcements.length === 0 ? (
        <div className="cm-empty"><span>📢</span><p>No announcements found.</p></div>
      ) : (
        <>
          <p className="cm-count">{total} announcement{total !== 1 ? "s" : ""}</p>
          <div className="cm-ann-list">
            {announcements.map(a => {
              const expired = a.expirationDate && new Date(a.expirationDate) < new Date();
              return (
                <div
                  className={`cm-ann-card ${!a.isRead && !isOwner ? "cm-ann-card--unread" : ""} ${expired ? "cm-ann-card--expired" : ""}`}
                  key={a._id}
                >
                  <div className="cm-ann-header">
                    <div className="cm-ann-left">
                      <span>{PRIORITY_ICON[a.priority]}</span>
                      <strong className="cm-ann-title">{a.title}</strong>
                      <span className={PRIORITY_CLS[a.priority]}>{a.priority}</span>
                      <span className="cm-badge cm-badge--category">{a.category}</span>
                      {!a.isRead && !isOwner && <span className="cm-badge cm-badge--unread">New</span>}
                      {expired && <span className="cm-badge cm-badge--expired">Expired</span>}
                    </div>
                    <span className="cm-ann-date">{fmt(a.publishDate)}</span>
                  </div>
                  <p className="cm-ann-excerpt">
                    {a.content.slice(0, 140)}{a.content.length > 140 ? "…" : ""}
                  </p>
                  <div className="cm-card-actions">
                    <button className="cm-btn cm-btn--view"
                      onClick={() => { setDetailAnn(a); if (!a.isRead && !isOwner) handleRead(a._id); }}>
                      Read More
                    </button>
                    {isOwner && (
                      <>
                        <button className="cm-btn cm-btn--edit" onClick={() => openEdit(a)}>Edit</button>
                        <button className="cm-btn cm-btn--delete" onClick={() => setDeleteTarget(a._id)}>Delete</button>
                      </>
                    )}
                    {!isOwner && !a.isRead && (
                      <button className="cm-btn cm-btn--view" onClick={() => handleRead(a._id)}>
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {pages > 1 && (
            <div className="cm-pagination">
              <button disabled={page <= 1}    onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Create/Edit Modal ── */}
      {showModal && isOwner && (
        <div className="cm-overlay" onClick={closeModal}>
          <div className="cm-modal cm-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>{editId ? "Edit Announcement" : "New Announcement"}</h2>
              <button className="cm-modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="cm-form" onSubmit={handleSave} noValidate>
              {formErr && <div className="cm-alert cm-alert--error">{formErr}</div>}
              <div className="cm-field cm-field--full">
                <label>Title *</label>
                <input className="cm-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="cm-field cm-field--full">
                <label>Content *</label>
                <textarea className="cm-input cm-textarea" rows={5} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              </div>
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>Category</label>
                  <select className="cm-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label>Priority</label>
                  <select className="cm-select" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {["Low","Normal","High","Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>Publish Date</label>
                  <input className="cm-input" type="date" value={form.publishDate}
                    onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} />
                </div>
                <div className="cm-field">
                  <label>Expiration Date (optional)</label>
                  <input className="cm-input" type="date" value={form.expirationDate}
                    onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} />
                </div>
              </div>
              <div className="cm-field">
                <label>Target Roles (leave empty = all staff)</label>
                <div className="cm-checkbox-row">
                  {["admin","finance","seller"].map(r => (
                    <label key={r} className="cm-checkbox-label">
                      <input type="checkbox" checked={form.targetRoles.includes(r)}
                        onChange={() => toggleRole(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              {staffUsers.length > 0 && (
                <div className="cm-field">
                  <label>Specific Users (optional)</label>
                  <div className="cm-participant-grid">
                    {staffUsers.map(u => (
                      <label key={u._id} className="cm-checkbox-label">
                        <input type="checkbox"
                          checked={form.targetUserIds.includes(u._id)}
                          onChange={() => toggleUser(u._id)} />
                        <span>{u.fullName} <em>({u.role})</em></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className="cm-checkbox-label" style={{ marginTop: 4 }}>
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                Publish immediately
              </label>
              <div className="cm-modal-footer">
                <button type="button" className="cm-btn cm-btn--cancel-plain"
                  onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="cm-btn cm-btn--save" disabled={saving}>
                  {saving ? "Saving…" : editId ? "Update" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailAnn && (
        <div className="cm-overlay" onClick={() => setDetailAnn(null)}>
          <div className="cm-modal cm-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <div>
                <h2>{PRIORITY_ICON[detailAnn.priority]} {detailAnn.title}</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span className={PRIORITY_CLS[detailAnn.priority]}>{detailAnn.priority}</span>
                  <span className="cm-badge cm-badge--category">{detailAnn.category}</span>
                  {detailAnn.expirationDate && (
                    <span className="cm-badge cm-badge--normal">
                      Expires: {new Date(detailAnn.expirationDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button className="cm-modal-close" onClick={() => setDetailAnn(null)}>×</button>
            </div>
            <div className="cm-detail-body">
              <p className="cm-ann-full-content">{detailAnn.content}</p>
              <div className="cm-detail-grid" style={{ marginTop: 16 }}>
                <div><span>Published by</span><strong>{detailAnn.createdBy?.fullName || "—"}</strong></div>
                <div><span>Published</span><strong>{fmt(detailAnn.publishDate)}</strong></div>
                {detailAnn.targetRoles?.length > 0 && (
                  <div><span>Audience</span><strong>{detailAnn.targetRoles.join(", ")}</strong></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="cm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cm-confirm" onClick={e => e.stopPropagation()}>
            <span>🗑</span><h3>Delete this announcement?</h3><p>This cannot be undone.</p>
            <div className="cm-confirm-actions">
              <button className="cm-btn cm-btn--cancel-plain" onClick={() => setDeleteTarget(null)}>Back</button>
              <button className="cm-btn cm-btn--delete" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
