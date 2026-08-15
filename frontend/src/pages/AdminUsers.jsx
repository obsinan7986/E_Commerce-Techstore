import { useEffect, useState, useCallback } from "react";
import {
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "../services/adminservice";
import { formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminUsers({ page, limit: LIMIT, keyword: keyword.trim(), role: roleFilter });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 3500);
  };

  const handleToggleAdmin = async (u) => {
    const newRole = u.role === "admin" ? "customer" : "admin";
    const label = newRole === "admin" ? "promote to Admin" : "demote to Customer";
    if (!window.confirm(`${label} for ${u.fullName}?`)) return;
    try {
      setActionLoading(u._id);
      await updateAdminUser(u._id, newRole);
      showFeedback("success", `${u.fullName} is now ${newRole}.`);
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to update role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (u) => {
    if (u._id === currentAdmin?._id) {
      showFeedback("error", "You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Delete user "${u.fullName}"? This cannot be undone.`)) return;
    try {
      setActionLoading(u._id);
      await deleteAdminUser(u._id);
      showFeedback("success", "User deleted.");
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>User Management</h1><p>{total} total users</p></div>
      </div>

      {feedback.message && (
        <div className={`admin-feedback admin-feedback--${feedback.type}`}>{feedback.message}</div>
      )}

      <div className="admin-filters">
        <input className="admin-search" type="text" placeholder="Search by name or email..."
          value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        <select className="admin-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : error ? (
        <div className="admin-error"><p>{error}</p><button onClick={load}>Retry</button></div>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <span className={`admin-badge ${u.role === "admin" ? "status-processing" : "status-pending"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button
                        className="admin-btn-sm-primary"
                        disabled={actionLoading === u._id || u._id === currentAdmin?._id}
                        onClick={() => handleToggleAdmin(u)}
                        title={u.role === "admin" ? "Demote to customer" : "Promote to admin"}
                      >
                        {actionLoading === u._id ? "..." : (u.role === "admin" ? "Demote" : "Make Admin")}
                      </button>
                      <button
                        className="admin-btn-sm-danger"
                        disabled={actionLoading === u._id || u._id === currentAdmin?._id}
                        onClick={() => handleDelete(u)}
                        title={u._id === currentAdmin?._id ? "Cannot delete yourself" : "Delete user"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {pages}</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
