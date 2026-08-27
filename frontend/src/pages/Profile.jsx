import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/profile.css";

/* ── Address Book sub-component ─────────────────────────── */
const EMPTY_ADDR = { label: "Home", fullName: "", phone: "", address: "", city: "", subCity: "" };

const AddressBook = ({ userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_ADDR);
  const [saving,    setSaving]    = useState(false);
  const [addrErr,   setAddrErr]   = useState("");

  const load = () =>
    api.get("/auth/addresses")
      .then(r => setAddresses(r.data.addresses || []))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm(EMPTY_ADDR); setAddrErr(""); setShowForm(true); };
  const openEdit = (a) => {
    setEditId(a._id);
    setForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, subCity: a.subCity || "" });
    setAddrErr("");
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setAddrErr("Full name, phone, address and city are required.");
      return;
    }
    try {
      setSaving(true);
      setAddrErr("");
      if (editId) await api.put(`/auth/addresses/${editId}`, form);
      else        await api.post("/auth/addresses", form);
      closeForm();
      await load();
    } catch (err) {
      setAddrErr(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    await api.delete(`/auth/addresses/${id}`).catch(() => {});
    await load();
  };

  const handleSetDefault = async (id) => {
    await api.patch(`/auth/addresses/${id}/default`).catch(() => {});
    await load();
  };

  return (
    <div className="addr-book">
      <div className="addr-book-header">
        <h2>Address Book</h2>
        <button className="addr-add-btn" onClick={openAdd} type="button">+ Add Address</button>
      </div>

      {addresses.length === 0 && !showForm && (
        <p className="addr-empty">No saved addresses yet.</p>
      )}

      <div className="addr-list">
        {addresses.map(a => (
          <div className={`addr-card ${a.isDefault ? "addr-card--default" : ""}`} key={a._id}>
            <div className="addr-card-body">
              <div className="addr-card-top">
                <span className="addr-label">{a.label}</span>
                {a.isDefault && <span className="addr-default-badge">Default</span>}
              </div>
              <p><strong>{a.fullName}</strong> · {a.phone}</p>
              <p>{a.address}, {a.city}{a.subCity ? `, ${a.subCity}` : ""}</p>
            </div>
            <div className="addr-card-actions">
              {!a.isDefault && (
                <button type="button" className="addr-btn addr-btn--default" onClick={() => handleSetDefault(a._id)}>
                  Set Default
                </button>
              )}
              <button type="button" className="addr-btn addr-btn--edit" onClick={() => openEdit(a)}>Edit</button>
              <button type="button" className="addr-btn addr-btn--delete" onClick={() => handleDelete(a._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="addr-form-wrap">
          <h3>{editId ? "Edit Address" : "New Address"}</h3>
          {addrErr && <div className="profile-error">{addrErr}</div>}
          <form className="addr-form" onSubmit={handleSave}>
            <div className="addr-form-row">
              <div className="form-group">
                <label>Label</label>
                <input className="addr-input" value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Home / Work / Other" />
              </div>
            </div>
            <div className="addr-form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input className="addr-input" value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input className="addr-input" type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Street Address *</label>
              <input className="addr-input" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div className="addr-form-row">
              <div className="form-group">
                <label>City *</label>
                <input className="addr-input" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Sub-city / District</label>
                <input className="addr-input" value={form.subCity}
                  onChange={e => setForm(f => ({ ...f, subCity: e.target.value }))} />
              </div>
            </div>
            <div className="addr-form-actions">
              <button type="button" className="addr-btn addr-btn--cancel" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="addr-btn addr-btn--save" disabled={saving}>
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ── Main Profile page ───────────────────────────────────── */
const Profile = () => {
  const { user, login: updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setForm({ fullName: user.fullName || "", phone: user.phone || "", address: user.address || "" });
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(""); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.phone.trim())    { setError("Phone number is required."); return; }
    try {
      setLoading(true); setError(""); setSuccess("");
      const { data } = await api.put("/auth/profile", { fullName: form.fullName, phone: form.phone, address: form.address });
      updateUser({ ...user, ...data });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1>{user.fullName}</h1>
            <p>{user.email}</p>
            {user.isAdmin && <span className="profile-admin-badge">Administrator</span>}
          </div>
        </div>

        {/* ── Profile form ── */}
        <form className="profile-form" onSubmit={handleSubmit}>
          <h2>Edit Profile</h2>
          {success && <div className="profile-success">{success}</div>}
          {error   && <div className="profile-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" name="fullName" value={form.fullName}
              onChange={handleChange} placeholder="Your full name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" value={user.email} readOnly className="input-readonly" />
            <small>Email cannot be changed.</small>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" name="phone" value={form.phone}
              onChange={handleChange} placeholder="+251 9..." required />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input id="address" type="text" name="address" value={form.address}
              onChange={handleChange} placeholder="Your address" />
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </form>

        {/* ── Address Book ── */}
        <AddressBook userId={user._id} />
      </div>
    </div>
  );
};

export default Profile;
