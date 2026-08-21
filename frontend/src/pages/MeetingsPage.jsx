/**
 * Meetings Page — /comm/meetings
 * Owner: full CRUD (create, edit, cancel, delete)
 * Admin/Finance/Seller: view-only (meetings visible to their role)
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMeetings, createMeeting, updateMeeting,
  cancelMeeting, deleteMeeting, getStaffUsers,
} from "../services/adminservice";
import "../styles/commModule.css";

const STATUS_CLS = {
  Scheduled: "cm-badge cm-badge--scheduled",
  Completed: "cm-badge cm-badge--completed",
  Cancelled: "cm-badge cm-badge--cancelled",
};
const TYPE_ICON = { Physical: "📍", Online: "🔗" };

const STAFF_ROLES = ["admin", "finance", "seller", "owner"];

const EMPTY_FORM = {
  title: "", description: "", date: "", startTime: "",
  endTime: "", location: "", meetingType: "Physical",
  meetingLink: "", targetRoles: [], participantIds: [],
};

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");

const MeetingsPage = () => {
  const { user, isOwner } = useAuth();

  const [meetings,    setMeetings]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom,   setFilterFrom]   = useState("");

  // Staff users for participant picker (owner only)
  const [staffUsers,  setStaffUsers]  = useState([]);

  // Create/Edit modal
  const [showModal,   setShowModal]   = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formErr,     setFormErr]     = useState("");

  // Detail modal
  const [detailMeeting, setDetailMeeting] = useState(null);

  // Cancel confirm
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling,   setCancelling]   = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      if (filterFrom)   params.from   = filterFrom;
      const res = await getMeetings(params);
      setMeetings(res.meetings || []);
      setTotal(res.total  || 0);
      setPages(res.pages  || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!isOwner) return;
    try {
      const res = await getStaffUsers();
      setStaffUsers(res.users || []);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); }, [page, filterStatus, filterFrom]);
  useEffect(() => { loadStaff(); }, [isOwner]);

  /* ── form helpers ── */
  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setFormErr(""); setShowModal(true);
  };
  const openEdit = (m) => {
    setEditId(m._id);
    setForm({
      title:          m.title,
      description:    m.description || "",
      date:           toDateInput(m.date),
      startTime:      m.startTime,
      endTime:        m.endTime,
      location:       m.location || "",
      meetingType:    m.meetingType,
      meetingLink:    m.meetingLink || "",
      targetRoles:    m.targetRoles || [],
      participantIds: (m.participants || []).map(p => p.user?._id || p.user),
    });
    setFormErr(""); setShowModal(true);
  };
  const closeModal = () => { if (saving) return; setShowModal(false); };

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));
  };
  const toggleParticipant = (uid) => {
    setForm(f => ({
      ...f,
      participantIds: f.participantIds.includes(uid)
        ? f.participantIds.filter(id => id !== uid)
        : [...f.participantIds, uid],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.title.trim())  return setFormErr("Title is required.");
    if (!form.date)          return setFormErr("Date is required.");
    if (!form.startTime)     return setFormErr("Start time is required.");
    if (!form.endTime)       return setFormErr("End time is required.");
    if (form.meetingType === "Online" && !form.meetingLink.trim())
      return setFormErr("Meeting link is required for online meetings.");
    try {
      setSaving(true);
      if (editId) await updateMeeting(editId, form);
      else        await createMeeting(form);
      closeModal();
      await load();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await cancelMeeting(cancelTarget, cancelReason);
      setCancelTarget(null); setCancelReason("");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Cancel failed.");
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—";

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1>📅 Meetings</h1>
          <p>{isOwner ? "Create and manage all meetings" : "Your scheduled meetings"}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="cm-refresh-btn" onClick={load}>↻ Refresh</button>
          {isOwner && (
            <button className="cm-primary-btn" onClick={openCreate}>+ New Meeting</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="cm-filters">
        <select className="cm-select" value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input className="cm-input" type="date" value={filterFrom}
          onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
          placeholder="From date" />
        {(filterStatus || filterFrom) && (
          <button className="cm-clear-btn"
            onClick={() => { setFilterStatus(""); setFilterFrom(""); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="cm-alert cm-alert--error">{error}</div>}

      {loading ? (
        <div className="cm-loading">Loading meetings…</div>
      ) : meetings.length === 0 ? (
        <div className="cm-empty"><span>📅</span><p>No meetings found.</p></div>
      ) : (
        <>
          <p className="cm-count">{total} meeting{total !== 1 ? "s" : ""}</p>
          <div className="cm-card-list">
            {meetings.map((m) => (
              <div className="cm-card" key={m._id}
                style={{ borderLeftColor: m.status === "Cancelled" ? "#DC2626" : m.status === "Completed" ? "#059669" : "#2563EB" }}>
                <div className="cm-card-header">
                  <div className="cm-card-left">
                    <span className="cm-type-icon">{TYPE_ICON[m.meetingType]}</span>
                    <strong className="cm-card-title">{m.title}</strong>
                    <span className={STATUS_CLS[m.status]}>{m.status}</span>
                  </div>
                  <div className="cm-card-right">
                    <span className="cm-card-date">
                      {fmt(m.date)} · {m.startTime}–{m.endTime}
                    </span>
                  </div>
                </div>
                {m.description && <p className="cm-card-desc">{m.description.slice(0, 100)}{m.description.length > 100 ? "…" : ""}</p>}
                <div className="cm-card-meta">
                  {m.location && <span>📍 {m.location}</span>}
                  {m.meetingType === "Online" && m.meetingLink && (
                    <a href={m.meetingLink} target="_blank" rel="noreferrer" className="cm-link">🔗 Join</a>
                  )}
                  <span>👥 {m.participants?.length || 0} participant{m.participants?.length !== 1 ? "s" : ""}</span>
                  {m.targetRoles?.length > 0 && (
                    <span>🎯 {m.targetRoles.join(", ")}</span>
                  )}
                </div>
                <div className="cm-card-actions">
                  <button className="cm-btn cm-btn--view" onClick={() => setDetailMeeting(m)}>
                    View Details
                  </button>
                  {isOwner && m.status !== "Cancelled" && (
                    <>
                      <button className="cm-btn cm-btn--edit" onClick={() => openEdit(m)}>Edit</button>
                      <button className="cm-btn cm-btn--cancel"
                        onClick={() => { setCancelTarget(m._id); setCancelReason(""); }}>
                        Cancel
                      </button>
                    </>
                  )}
                  {isOwner && (
                    <button className="cm-btn cm-btn--delete" onClick={() => setDeleteTarget(m._id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
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
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>{editId ? "Edit Meeting" : "New Meeting"}</h2>
              <button className="cm-modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="cm-form" onSubmit={handleSave} noValidate>
              {formErr && <div className="cm-alert cm-alert--error">{formErr}</div>}

              <div className="cm-form-row">
                <div className="cm-field cm-field--full">
                  <label>Title *</label>
                  <input className="cm-input" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
              </div>
              <div className="cm-field cm-field--full">
                <label>Description</label>
                <textarea className="cm-input cm-textarea" rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>Date *</label>
                  <input className="cm-input" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="cm-field">
                  <label>Start Time *</label>
                  <input className="cm-input" type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="cm-field">
                  <label>End Time *</label>
                  <input className="cm-input" type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>Meeting Type</label>
                  <select className="cm-select" value={form.meetingType}
                    onChange={e => setForm(f => ({ ...f, meetingType: e.target.value }))}>
                    <option value="Physical">Physical</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div className="cm-field">
                  <label>{form.meetingType === "Online" ? "Meeting Link *" : "Location"}</label>
                  <input className="cm-input"
                    value={form.meetingType === "Online" ? form.meetingLink : form.location}
                    placeholder={form.meetingType === "Online" ? "https://meet.google.com/…" : "Room / Address"}
                    onChange={e => setForm(f => form.meetingType === "Online"
                      ? { ...f, meetingLink: e.target.value }
                      : { ...f, location: e.target.value }
                    )} />
                </div>
              </div>

              {/* Target roles */}
              <div className="cm-field">
                <label>Target Roles (all with these roles see this meeting)</label>
                <div className="cm-checkbox-row">
                  {["admin", "finance", "seller"].map(r => (
                    <label key={r} className="cm-checkbox-label">
                      <input type="checkbox" checked={form.targetRoles.includes(r)}
                        onChange={() => toggleRole(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              {/* Individual participants */}
              {staffUsers.length > 0 && (
                <div className="cm-field">
                  <label>Individual Participants</label>
                  <div className="cm-participant-grid">
                    {staffUsers.map(u => (
                      <label key={u._id} className="cm-checkbox-label">
                        <input type="checkbox"
                          checked={form.participantIds.includes(u._id)}
                          onChange={() => toggleParticipant(u._id)} />
                        <span>{u.fullName} <em>({u.role})</em></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="cm-modal-footer">
                <button type="button" className="cm-btn cm-btn--cancel-plain"
                  onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="cm-btn cm-btn--save" disabled={saving}>
                  {saving ? "Saving…" : editId ? "Update Meeting" : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailMeeting && (
        <div className="cm-overlay" onClick={() => setDetailMeeting(null)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>📅 {detailMeeting.title}</h2>
              <button className="cm-modal-close" onClick={() => setDetailMeeting(null)}>×</button>
            </div>
            <div className="cm-detail-body">
              <div className="cm-detail-grid">
                <div><span>Status</span><strong><span className={STATUS_CLS[detailMeeting.status]}>{detailMeeting.status}</span></strong></div>
                <div><span>Type</span><strong>{TYPE_ICON[detailMeeting.meetingType]} {detailMeeting.meetingType}</strong></div>
                <div><span>Date</span><strong>{fmt(detailMeeting.date)}</strong></div>
                <div><span>Time</span><strong>{detailMeeting.startTime} – {detailMeeting.endTime}</strong></div>
                {detailMeeting.location && <div><span>Location</span><strong>{detailMeeting.location}</strong></div>}
                {detailMeeting.meetingLink && (
                  <div><span>Link</span>
                    <a href={detailMeeting.meetingLink} target="_blank" rel="noreferrer" className="cm-link">
                      Join Meeting ↗
                    </a>
                  </div>
                )}
                <div><span>Created by</span><strong>{detailMeeting.createdBy?.fullName || "—"}</strong></div>
                {detailMeeting.cancelReason && (
                  <div className="cm-field--full"><span>Cancel Reason</span><strong>{detailMeeting.cancelReason}</strong></div>
                )}
              </div>
              {detailMeeting.description && (
                <div className="cm-detail-section">
                  <h3>Description</h3>
                  <p>{detailMeeting.description}</p>
                </div>
              )}
              {detailMeeting.targetRoles?.length > 0 && (
                <div className="cm-detail-section">
                  <h3>Target Roles</h3>
                  <p>{detailMeeting.targetRoles.join(", ")}</p>
                </div>
              )}
              {detailMeeting.participants?.length > 0 && (
                <div className="cm-detail-section">
                  <h3>Participants ({detailMeeting.participants.length})</h3>
                  <div className="cm-participant-list">
                    {detailMeeting.participants.map((p, i) => (
                      <div key={i} className="cm-participant-item">
                        <div className="cm-avatar">{(p.user?.fullName || "?").charAt(0)}</div>
                        <div>
                          <strong>{p.user?.fullName || "—"}</strong>
                          <span>{p.user?.role || ""}</span>
                        </div>
                        <span className={`cm-badge cm-badge--${p.status}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm ── */}
      {cancelTarget && (
        <div className="cm-overlay" onClick={() => setCancelTarget(null)}>
          <div className="cm-confirm" onClick={e => e.stopPropagation()}>
            <span>⚠️</span>
            <h3>Cancel this meeting?</h3>
            <textarea className="cm-input cm-textarea" rows={2}
              placeholder="Reason for cancellation (optional)…"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)} />
            <div className="cm-confirm-actions">
              <button className="cm-btn cm-btn--cancel-plain" onClick={() => setCancelTarget(null)}>Back</button>
              <button className="cm-btn cm-btn--cancel" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="cm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cm-confirm" onClick={e => e.stopPropagation()}>
            <span>🗑</span>
            <h3>Delete this meeting?</h3>
            <p>This cannot be undone.</p>
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

export default MeetingsPage;
