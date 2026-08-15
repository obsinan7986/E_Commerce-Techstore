import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import "../styles/searchpage.css";

const SearchPage = () => {
  const { keyword } = useParams();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!keyword?.trim()) { setLoading(false); return; }
    setLoading(true);
    setError("");
    api.get(`/products/search/${encodeURIComponent(keyword)}`)
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setError("Unable to load search results."))
      .finally(() => setLoading(false));
  }, [keyword]);

  return (
    <main className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        {!loading && !error && (
          <p>
            {products.length > 0
              ? <><strong>{products.length}</strong> result{products.length !== 1 ? "s" : ""} for <strong>"{keyword}"</strong></>
              : <>No results for <strong>"{keyword}"</strong></>
            }
          </p>
        )}
      </div>

      {loading ? (
        <div className="ts-loading">Searching…</div>
      ) : error ? (
        <div className="ts-error">
          <p>{error}</p>
          <Link to="/products" className="btn-primary" style={{ marginTop: 12 }}>Browse All Products</Link>
        </div>
      ) : products.length === 0 ? (
        <div className="search-message">
          <span style={{ fontSize: 52, opacity: 0.3 }}>🔍</span>
          <h2>No products found</h2>
          <p>Try different keywords or browse our categories.</p>
          <Link to="/products" className="btn-primary" style={{ marginTop: 16 }}>Browse All Products</Link>
        </div>
      ) : (
        <div className="ts-products-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
};

export default SearchPage;
