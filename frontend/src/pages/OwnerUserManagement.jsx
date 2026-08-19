/**
 * Owner — User Management  /owner/users
 * Create accounts, promote/demote, suspend/activate, view KYC status
 */
import { useEffect, useRef, useState } from "react";
import api, { BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/ownerDashboard.css";

const ROLES     = ["customer", "seller", "admin", "finance", "owner"];
const KYC_LABEL = { not_submitted: "Not submitted", pending: "Pending", verified: "Verified", rejected: "Rejected" };
const KYC_CLS   = { not_submitted: "kyc-ns", pending: "kyc-pending", verified: "kyc-ok", rejected: "kyc-rej" };

const EMPTY_FORM = { fullName: "", email: "", phone: "", password: "", role: "seller" };

const OwnerUserManagement = () => {
  const { user: me } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Filters
  const [keyword,     setKeyword]     = useState("");
  const [filterRole,  setFilterRole]  = useState("");
  const [filterSusp,  setFilterSusp]  = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [formErr,    setFormErr]    = useState("");

  // Role change inline
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole,    setNewRole]    = useState("");
  const [roleBusy,   setRoleBusy]   = useState(false);

  // KYC modal
  const [kycUser,    setKycUser]    = useState(null);
  const [kycReason,  setKycReason]  = useState("");
  const [kycBusy,    setKycBusy]    = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 15, keyword, role: filterRole };
      if (filterSusp !== "") params.isSuspended = filterSusp;
      const { data } = await api.get("/owner/users", { params });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, keyword, filterRole, filterSusp]);

  // ── Create user ──────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr("");
    try {
      setCreating(true);
      await api.post("/owner/users", form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Creation failed.");
    } finally {
      setCreating(false);
    }
  };

  // ── Change role ──────────────────────────────────────────
  const submitRoleChange = async (userId) => {
    if (!newRole) return;
    try {
      setRoleBusy(true);
      await api.put(`/owner/users/${userId}/role`, { role: newRole });
      setRoleTarget(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Role change failed.");
    } finally {
      setRoleBusy(false);
    }
  };

  // ── Suspend / Activate ───────────────────────────────────
  const toggleSuspend = async (u) => {
    const path = u.isSuspended ? "activate" : "suspend";
    try {
      await api.patch(`/owner/users/${u._id}/${path}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  };

  // ── KYC approve / reject ─────────────────────────────────
  const handleKycApprove = async () => {
    try {
      setKycBusy(true);
      await api.patch(`/owner/kyc/${kycUser._id}/approve`);
      setKycUser(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "KYC approval failed.");
    } finally {
      setKycBusy(false);
    }
  };

  const handleKycReject = async () => {
    if (!kycReason.trim()) { alert("Please enter a rejection reason."); return; }
    try {
      setKycBusy(true);
      await api.patch(`/owner/kyc/${kycUser._id}/reject`, { reason: kycReason });
      setKycUser(null);
      setKycReason("");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "KYC rejection failed.");
    } finally {
      setKycBusy(false);
    }
  };

  const roleBadge = (r) => {
    const map = { owner: "role-owner", admin: "role-admin", finance: "role-finance", seller: "role-seller", customer: "role-customer" };
    return <span className={`role-badge ${map[r] || ""}`}>{r}</span>;
  };

  return (
    <div className="od-page">
      <div className="od-header">
        <div><h1>User Management</h1><p>Create and manage all accounts</p></div>
        <button className="od-btn od-btn--primary" onClick={() => setShowCreate(true)}>+ Create User</button>
      </div>

      {/* Filters */}
      <div className="od-filters">
        <input className="od-input" placeholder="Search name / email / phone…"
          value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        <select className="od-select" value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="od-select" value={filterSusp}
          onChange={(e) => { setFilterSusp(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
        <button className="od-btn od-btn--ghost" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="od-alert od-alert--error">{error}</div>}

      {loading ? <div className="od-loading">Loading…</div> : (
        <>
          <p className="od-count">{total} user{total !== 1 ? "s" : ""} found</p>
          <div className="od-table-wrap">
            <table className="od-table">
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={u.isSuspended ? "od-row--suspended" : ""}>
                    <td>
                      <div className="od-user-cell">
                        <strong>{u.fullName}</strong>
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      {roleTarget === u._id ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <select className="od-select od-select--sm" value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}>
                            <option value="">Pick…</option>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button className="od-btn od-btn--xs od-btn--primary"
                            onClick={() => submitRoleChange(u._id)} disabled={roleBusy}>✓</button>
                          <button className="od-btn od-btn--xs od-btn--ghost"
                            onClick={() => setRoleTarget(null)}>✕</button>
                        </div>
                      ) : (
                        <span style={{ cursor: "pointer" }} onClick={() => { setRoleTarget(u._id); setNewRole(u.role); }}>
                          {roleBadge(u.role)} <small style={{ color: "#9CA3AF" }}>▾</small>
                        </span>
                      )}
                    </td>
                    <td>
                      {u.role === "seller" ? (
                        <span className={`kyc-badge ${KYC_CLS[u.kycStatus]}`}
                          style={{ cursor: u.kycStatus === "pending" ? "pointer" : "default" }}
                          onClick={() => u.kycStatus === "pending" && setKycUser(u)}>
                          {KYC_LABEL[u.kycStatus]}
                          {u.kycStatus === "pending" && " (review)"}
                        </span>
                      ) : <span style={{ color: "#D1D5DB" }}>—</span>}
                    </td>
                    <td>
                      <span className={`status-badge ${u.isSuspended ? "status-susp" : "status-active"}`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="od-action-row">
                        {u._id !== me?._id && (
                          <button
                            className={`od-btn od-btn--xs ${u.isSuspended ? "od-btn--success" : "od-btn--warn"}`}
                            onClick={() => toggleSuspend(u)}>
                            {u.isSuspended ? "Activate" : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="od-pagination">
              <button className="od-btn od-btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>{page} / {pages}</span>
              <button className="od-btn od-btn--ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Create User Modal ── */}
      {showCreate && (
        <div className="od-overlay" onClick={() => setShowCreate(false)}>
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-header">
              <h2>Create User Account</h2>
              <button className="od-modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form className="od-form" onSubmit={handleCreate}>
              {formErr && <div className="od-alert od-alert--error">{formErr}</div>}
              <div className="od-form-row">
                <div className="od-field">
                  <label>Full Name *</label>
                  <input className="od-input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
                </div>
                <div className="od-field">
                  <label>Email *</label>
                  <input className="od-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div className="od-form-row">
                <div className="od-field">
                  <label>Phone *</label>
                  <input className="od-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="od-field">
                  <label>Role *</label>
                  <select className="od-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="od-field">
                <label>Password *</label>
                <input className="od-input" type="password" value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="od-modal-footer">
                <button type="button" className="od-btn od-btn--ghost" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
                <button type="submit" className="od-btn od-btn--primary" disabled={creating}>
                  {creating ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── KYC Review Modal ── */}
      {kycUser && (
        <div className="od-overlay" onClick={() => setKycUser(null)}>
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-header">
              <h2>KYC Review — {kycUser.fullName}</h2>
              <button className="od-modal-close" onClick={() => setKycUser(null)}>×</button>
            </div>
            <div className="od-kyc-docs">
              {[["National ID – Front", kycUser.kycDocs?.idFront], ["National ID – Back", kycUser.kycDocs?.idBack], ["Selfie", kycUser.kycDocs?.selfie]].map(([label, path]) => (
                <div key={label} className="od-kyc-doc">
                  <p className="od-kyc-doc-label">{label}</p>
                  {path ? (
                    <a href={`${BASE_URL}${path}`} target="_blank" rel="noreferrer">
                      <img src={`${BASE_URL}${path}`} alt={label} className="od-kyc-img" onError={(e) => { e.target.style.opacity = "0.3"; }} />
                    </a>
                  ) : <div className="od-kyc-missing">Not uploaded</div>}
                </div>
              ))}
            </div>
            <div className="od-field" style={{ padding: "0 0 12px" }}>
              <label>Rejection reason (required to reject)</label>
              <textarea className="od-input od-textarea" rows={2} placeholder="Enter reason…"
                value={kycReason} onChange={(e) => setKycReason(e.target.value)} />
            </div>
            <div className="od-modal-footer">
              <button className="od-btn od-btn--ghost" onClick={() => setKycUser(null)}>Cancel</button>
              <button className="od-btn od-btn--danger" onClick={handleKycReject} disabled={kycBusy}>Reject</button>
              <button className="od-btn od-btn--success" onClick={handleKycApprove} disabled={kycBusy}>Approve KYC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerUserManagement;
