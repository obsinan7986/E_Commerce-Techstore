import { useEffect, useState, useCallback } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminProductStock,
} from "../services/adminservice";
import { getLowStockProducts } from "../services/adminservice";
import { formatCurrency }      from "../utils/formatters";
import "../styles/admin.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

const CATEGORIES = [
  "Smartphones","Laptops","Tablets","Accessories",
  "Gaming","Headphones","Speakers","Cameras","Televisions","Smartwatches",
];

const BLANK = {
  name: "", description: "", brand: "",
  category: "Smartphones", price: "", stock: "", image: "",
};

/* ── Stock status helper ── */
const stockInfo = (s) => {
  if (s === 0)  return { label: "Out of Stock", cls: "inv-badge--out" };
  if (s <= 9)   return { label: "Low Stock",    cls: "inv-badge--low" };
  return              { label: "In Stock",     cls: "inv-badge--in"  };
};

const AdminProducts = () => {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [feedback,     setFeedback]     = useState({ type: "", message: "" });
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
  const [keyword,      setKeyword]      = useState("");
  const [category,     setCategory]     = useState("");
  const [stockFilter,  setStockFilter]  = useState("");
  const [sortBy,       setSortBy]       = useState("createdAt-desc");

  /* Low-stock alert banner */
  const [lowStockCount, setLowStockCount] = useState(0);

  /* Create / Edit modal */
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(BLANK);
  const [formLoading,  setFormLoading]  = useState(false);
  const [deleteLoading,setDeleteLoading]= useState(null);

  /* Inline stock quick-edit */
  const [editingStock, setEditingStock] = useState(null);  // product._id
  const [stockVal,     setStockVal]     = useState("");
  const [stockSaving,  setStockSaving]  = useState(false);

  const LIMIT = 12;

  const sortParam = () => {
    const map = {
      "createdAt-desc": "newest",
      "priceAsc":       "priceAsc",
      "priceDesc":      "priceDesc",
      "stockAsc":       "stockAsc",
      "nameAsc":        "nameAsc",
    };
    return map[sortBy] || "newest";
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [data, lowData] = await Promise.all([
        getAdminProducts({ page, limit: LIMIT, keyword: keyword.trim(), category, stockFilter, sort: sortParam() }),
        getLowStockProducts(),
      ]);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setLowStockCount((lowData.products || []).filter((p) => p.stock <= 9).length);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category, stockFilter, sortBy]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const flash = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 3500);
  };

  /* ── Modal helpers ── */
  const openCreate = () => { setEditTarget(null); setForm(BLANK); setShowForm(true); };
  const openEdit   = (p)  => {
    setEditTarget(p._id);
    setForm({ name: p.name, description: p.description, brand: p.brand,
               category: p.category, price: p.price, stock: p.stock, image: p.image || "" });
    setShowForm(true);
  };
  const closeForm  = () => { setShowForm(false); setEditTarget(null); setForm(BLANK); };

  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim() || !form.description.trim() || !form.price) {
      flash("error", "Name, brand, description and price are required."); return;
    }
    if (Number(form.price) <= 0) { flash("error", "Price must be greater than 0."); return; }
    if (form.stock !== "" && Number(form.stock) < 0) { flash("error", "Stock cannot be negative."); return; }

    try {
      setFormLoading(true);
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock || 0) };
      if (editTarget) {
        await updateAdminProduct(editTarget, payload);
        flash("success", "Product updated.");
      } else {
        await createAdminProduct(payload);
        flash("success", "Product created.");
      }
      closeForm();
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to save product.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      setDeleteLoading(id);
      await deleteAdminProduct(id);
      flash("success", "Product deleted.");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleteLoading(null);
    }
  };

  /* ── Inline stock quick-edit ── */
  const startEditStock = (p) => {
    setEditingStock(p._id);
    setStockVal(String(p.stock));
  };

  const saveStock = async (id) => {
    const val = Number(stockVal);
    if (isNaN(val) || val < 0) { flash("error", "Stock must be a non-negative number."); return; }
    try {
      setStockSaving(true);
      await updateAdminProductStock(id, val);
      flash("success", "Stock updated.");
      setEditingStock(null);
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to update stock.");
    } finally {
      setStockSaving(false);
    }
  };

  const cancelEditStock = () => { setEditingStock(null); setStockVal(""); };

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Product Inventory</h1>
          <p>{total} products total</p>
        </div>
        <button className="refresh-btn" onClick={openCreate}>+ Add Product</button>
      </div>

      {/* Low-stock alert banner */}
      {lowStockCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 18px", marginBottom: 18,
          background: "#FFFBEB", border: "1.5px solid #FDE68A",
          borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#92400E",
        }}>
          ⚠ {lowStockCount} product{lowStockCount !== 1 ? "s" : ""} with low or zero stock.
          <button
            onClick={() => { setStockFilter("low"); setPage(1); }}
            style={{ marginLeft: 4, background: "none", border: "none", color: "#2563EB", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            View low stock →
          </button>
        </div>
      )}

      {feedback.message && (
        <div className={`admin-feedback admin-feedback--${feedback.type}`}>{feedback.message}</div>
      )}

      {/* Filters */}
      <div className="admin-filters" style={{ flexWrap: "wrap" }}>
        <input className="admin-search" type="text" placeholder="Search products…"
          value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />

        <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="admin-select" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="">All Stock</option>
          <option value="in">In Stock (&gt; 9)</option>
          <option value="low">Low Stock (1–9)</option>
          <option value="out">Out of Stock (0)</option>
        </select>

        <select className="admin-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
          <option value="createdAt-desc">Newest</option>
          <option value="nameAsc">Name A–Z</option>
          <option value="priceAsc">Price Low–High</option>
          <option value="priceDesc">Price High–Low</option>
          <option value="stockAsc">Stock Low–High</option>
        </select>

        {(keyword || category || stockFilter) && (
          <button className="admin-btn admin-btn-secondary" style={{ height: 40 }}
            onClick={() => { setKeyword(""); setCategory(""); setStockFilter(""); setPage(1); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : error ? (
        <div className="admin-error"><p>{error}</p><button onClick={load}>Retry</button></div>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                      No products found.
                    </td>
                  </tr>
                ) : products.map((p) => {
                  const info  = stockInfo(p.stock);
                  const isEditingThisStock = editingStock === p._id;

                  return (
                    <tr key={p._id} style={p.stock === 0 ? { background: "#FFF8F8" } : p.stock <= 9 ? { background: "#FFFDF0" } : {}}>
                      <td>
                        <img
                          src={p.image?.startsWith("http") ? p.image : `${BASE}${p.image}`}
                          alt={p.name}
                          style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                          onError={(e) => { e.target.src = "/placeholder.png"; }}
                        />
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <small>{p.brand}</small>
                      </td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</td>

                      {/* Inline stock editor */}
                      <td>
                        {isEditingThisStock ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              type="number"
                              min={0}
                              value={stockVal}
                              onChange={(e) => setStockVal(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveStock(p._id); if (e.key === "Escape") cancelEditStock(); }}
                              style={{ width: 64, height: 32, padding: "0 8px", border: "1.5px solid #2563EB", borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
                              autoFocus
                            />
                            <button
                              style={{ padding: "4px 10px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              onClick={() => saveStock(p._id)} disabled={stockSaving}
                            >
                              {stockSaving ? "…" : "✓"}
                            </button>
                            <button
                              style={{ padding: "4px 8px", background: "#F3F4F6", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#374151" }}
                              onClick={cancelEditStock}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{ cursor: "pointer", fontWeight: 700, color: p.stock === 0 ? "#DC2626" : p.stock <= 9 ? "#D97706" : "#111827", borderBottom: "1px dashed #D1D5DB", paddingBottom: 1 }}
                            title="Click to edit stock"
                            onClick={() => startEditStock(p)}
                          >
                            {p.stock}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`admin-badge inv-badge ${info.cls}`}>{info.label}</span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="admin-btn-sm-primary" onClick={() => openEdit(p)}>Edit</button>
                          <button
                            className="admin-btn-sm-danger"
                            onClick={() => handleDelete(p._id, p.name)}
                            disabled={deleteLoading === p._id}
                          >
                            {deleteLoading === p._id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {pages} · {total} products</span>
              <div>
                <button disabled={page <= 1}    onClick={() => setPage((p) => p - 1)}>Previous</button>
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
              <div>
                <h2>{editTarget ? "Edit Product" : "Add Product"}</h2>
                <p>{editTarget ? "Update product details" : "Fill in the product details"}</p>
              </div>
              <button className="admin-modal-close" onClick={closeForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Name *",           name: "name",  type: "text",   placeholder: "Product name" },
                { label: "Brand *",          name: "brand", type: "text",   placeholder: "Brand" },
                { label: "Price (ETB) *",    name: "price", type: "number", placeholder: "0", min: 1 },
                { label: "Stock Quantity",   name: "stock", type: "number", placeholder: "0", min: 0 },
                { label: "Image path (e.g. /uploads/img.jpg)", name: "image", type: "text", placeholder: "/uploads/..." },
              ].map(({ label, name, ...rest }) => (
                <div key={name} className="form-group">
                  <label>{label}</label>
                  <input name={name} value={form[name]} onChange={handleFormChange} {...rest} />
                </div>
              ))}

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleFormChange} className="admin-select" style={{ height: 42 }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description" value={form.description} onChange={handleFormChange}
                  rows={3} placeholder="Product description…"
                  style={{ padding: "10px 13px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              {/* Stock hint */}
              {form.stock !== "" && (
                <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: Number(form.stock) === 0 ? "#FEF2F2" : Number(form.stock) <= 9 ? "#FFFBEB" : "#F0FDF4",
                  color:      Number(form.stock) === 0 ? "#B91C1C" : Number(form.stock) <= 9 ? "#92400E" : "#166534",
                }}>
                  {Number(form.stock) === 0 ? "✗ Out of Stock" : Number(form.stock) <= 9 ? `⚠ Low Stock (${form.stock} units)` : `✓ In Stock (${form.stock} units)`}
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn admin-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving…" : editTarget ? "Save Changes" : "Create Product"}
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
