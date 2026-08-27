/**
 * Image Search Page — /image-search
 *
 * Accepts an image file (from navbar camera button via route state,
 * or via drag-and-drop / click on this page), sends it to
 * POST /api/products/image-search, and displays matching products
 * using the existing ProductCard component.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import api from "../services/api";
import "../styles/imageSearch.css";

const ALLOWED_TYPES  = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB    = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ImageSearchPage = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const fileRef    = useRef(null);

  const [preview,   setPreview]   = useState(null);
  const [file,      setFile]      = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [searched,  setSearched]  = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  // If navigated from Navbar camera button with a file in state, auto-search
  useEffect(() => {
    const stateFile = location.state?.file;
    if (stateFile) {
      handleFile(stateFile);
      // Clear state so back-navigation doesn't re-trigger
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return "Only JPG, PNG and WEBP images are supported.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `Image must be under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError("");
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
    // Auto-search immediately
    runSearch(f);
  }, []);

  const runSearch = async (f) => {
    try {
      setLoading(true);
      setError("");
      setProducts([]);
      setSearched(false);

      const fd = new FormData();
      fd.append("image", f);

      const { data } = await api.post("/products/image-search", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProducts(data.products || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setProducts([]);
    setSearched(false);
    setError("");
  };

  return (
    <div className="isearch-page">
      <div className="isearch-header">
        <button className="isearch-back" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1>🔍 Image Search</h1>
          <p>Upload a photo to find visually similar products</p>
        </div>
      </div>

      {/* Upload zone */}
      {!file && (
        <div
          className={`isearch-dropzone ${dragOver ? "isearch-dropzone--over" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload image for search"
          onKeyDown={(e) => { if (e.key === "Enter") fileRef.current?.click(); }}
        >
          <span className="isearch-drop-icon">📷</span>
          <p className="isearch-drop-text">Click or drag an image here</p>
          <p className="isearch-drop-hint">JPG, PNG, WEBP · max {MAX_SIZE_MB}MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Preview + re-search */}
      {file && (
        <div className="isearch-preview-wrap">
          <div className="isearch-preview">
            <img src={preview} alt="Search image" className="isearch-preview-img" />
            <div className="isearch-preview-info">
              <p className="isearch-preview-name">{file.name}</p>
              <p className="isearch-preview-size">{(file.size / 1024).toFixed(0)} KB</p>
              <div className="isearch-preview-actions">
                <button className="isearch-btn isearch-btn--retry"
                  onClick={() => runSearch(file)} disabled={loading}>
                  {loading ? "Searching…" : "↻ Search Again"}
                </button>
                <button className="isearch-btn isearch-btn--change"
                  onClick={handleReset}>
                  Change Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="isearch-error">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="isearch-loading">
          <div className="isearch-spinner" />
          <p>Searching for similar products…</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="isearch-results">
          <h2 className="isearch-results-title">
            {products.length > 0
              ? `${products.length} product${products.length !== 1 ? "s" : ""} found`
              : "No matching products found"}
          </h2>
          {products.length === 0 ? (
            <div className="isearch-empty">
              <span>📦</span>
              <p>Try a different image or use text search instead.</p>
              <button className="isearch-btn isearch-btn--retry" onClick={() => navigate("/products")}>
                Browse All Products
              </button>
            </div>
          ) : (
            <div className="isearch-grid">
              {products.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSearchPage;
