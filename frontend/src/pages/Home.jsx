import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";

import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";

import "../styles/home.css";

const Home = () => {
  const location = useLocation();
  const justRegistered = location.state?.registered === true;

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showBanner, setShowBanner] = useState(justRegistered);

  useEffect(() => {
    api.get("/products?limit=12&sort=newest")
      .then(({ data }) => setProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-dismiss the success banner after 5 seconds
  useEffect(() => {
    if (!showBanner) return;
    const t = setTimeout(() => setShowBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showBanner]);

  return (
    <div className="home-page">

      {/* ── Registration success banner ── */}
      {showBanner && (
        <div className="home-success-banner" role="status">
          <span>🎉 Welcome to OBSA_TechStore! Your account has been created successfully.</span>
          <button
            type="button"
            className="home-success-close"
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Hero + feature strip */}
      <HeroBanner />

      {/* Featured products */}
      <section className="latest-products">
        <div className="section-title-block">
          <h2>Featured Products</h2>
          <Link to="/products">View All Products →</Link>
        </div>

        {loading ? (
          <div className="ts-loading">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="ts-empty">
            <span className="ts-empty-icon">📦</span>
            <h3>No products yet</h3>
          </div>
        ) : (
          <div className="featured-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
