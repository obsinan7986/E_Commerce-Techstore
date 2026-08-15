import { useEffect, useState, useCallback } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminProductStock,
} from "../services/adminservice";
import { formatCurrency } from "../utils/formatters";
import "../styles/admin.css";

const CATEGORIES = [
  "Smartphones", "Laptops", "Tablets", "Accessories",
  "Gaming", "Headphones", "Speakers", "Cameras", "Televisions", "Smartwatches",
];

const BLANK = { name: "", description: "", brand: "", category: "Smartphones", price: "", stock: "", image: "" };

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form, setForm] = useState(BLANK);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const LIMIT = 10;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminProducts({ page, limit: LIMIT, keyword: keyword.trim(), category });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category]);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 3500);
  };

  const openCreate = () => { setEditTarget(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (p) => {
    setEditTarget(p._id);
    setForm({ name: p.name, description: p.description, brand: p.brand, category: p.category, price: p.price, stock: p.stock, image: p.image || "" });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(BLANK); };

  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim() || !form.description.trim() || !form.price) {
      showFeedback("error", "Name, brand, description and price are required.");
      return;
    }
    if (Number(form.price) <= 0) { showFeedback("error", "Price must be greater than 0."); return; }
    if (form.stock !== "" && Number(form.stock) < 0) { showFeedback("error", "Stock cannot be negative."); return; }

    try {
      setFormLoading(true);
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock || 0) };
      if (editTarget) {
        await updateAdminProduct(editTarget, payload);
        showFeedback("success", "Product updated.");
      } else {
        await createAdminProduct(payload);
        showFeedback("success", "Product created.");
      }
      closeForm();
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to save product.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      setDeleteLoading(id);
      await deleteAdminProduct(id);
      showFeedback("success", "Product deleted.");
      load();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const stockColor = (s) => s === 0 ? "#dc2626" : s <= 5 ? "#d97706" : "#16a34a";

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>Product Management</h1><p>{total} products</p></div>
        <button className="refresh-btn" onClick={openCreate}>+ Add Product</button>
      </div>

      {feedback.message && (
        <div className={`admin-feedback admin-feedback--${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <input className="admin-search" type="text" placeholder="Search products..." value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading products...</div>
      ) : error ? (
        <div className="admin-error"><p>{error}</p><button onClick={load}>Retry</button></div>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No products found.</td></tr>
                ) : products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <img
                        src={p.image?.startsWith("http") ? p.image : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${p.image}`}
                        alt={p.name}
                        style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 6, border: "1px solid #e5e7eb" }}
                        onError={(e) => { e.target.src = "/placeholder.png"; }}
                      />
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <small>{p.brand}</small>
                    </td>
                    <td>{p.category}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td style={{ color: stockColor(p.stock), fontWeight: 700 }}>{p.stock}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="admin-btn-sm-primary" onClick={() => openEdit(p)}>Edit</button>
                      <button
                        className="admin-btn-sm-danger"
                        onClick={() => handleDelete(p._id, p.name)}
                        disabled={deleteLoading === p._id}
                      >
                        {deleteLoading === p._id ? "..." : "Delete"}
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

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <h2>{editTarget ? "Edit Product" : "Add Product"}</h2>
              <button className="admin-modal-close" onClick={closeForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Name *", name: "name", type: "text", placeholder: "Product name" },
                { label: "Brand *", name: "brand", type: "text", placeholder: "Brand" },
                { label: "Price (ETB) *", name: "price", type: "number", placeholder: "0", min: 0 },
                { label: "Stock", name: "stock", type: "number", placeholder: "0", min: 0 },
                { label: "Image path (e.g. /uploads/img.jpg)", name: "image", type: "text", placeholder: "/uploads/..." },
              ].map(({ label, name, ...rest }) => (
                <div key={name} className="form-group">
                  <label>{label}</label>
                  <input name={name} value={form[name]} onChange={handleFormChange} {...rest} />
                </div>
              ))}

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleFormChange} className="admin-select">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleFormChange}
                  rows={3} placeholder="Product description..."
                  style={{ padding: "10px 13px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
              </div>

              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn admin-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : (editTarget ? "Save Changes" : "Create Product")}
                </button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
