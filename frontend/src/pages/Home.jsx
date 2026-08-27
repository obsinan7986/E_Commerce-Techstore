import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";

import HeroBanner  from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";

import "../styles/home.css";

const Home = () => {
  const { t }      = useTranslation();
  const location   = useLocation();
  const justRegistered = location.state?.registered === true;

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showBanner, setShowBanner] = useState(justRegistered);

  useEffect(() => {
    api.get("/products?limit=12&sort=newest")
      .then(({ data }) => setProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => setShowBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showBanner]);

  return (
    <div className="home-page">

      {showBanner && (
        <div className="home-success-banner" role="status">
          <span>🎉 {t("auth.joinUs")}</span>
          <button
            type="button"
            className="home-success-close"
            onClick={() => setShowBanner(false)}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>
      )}

      <HeroBanner />

      <section className="latest-products">
        <div className="section-title-block">
          <h2>{t("product.featuredProducts")}</h2>
          <Link to="/products">{t("product.viewAll")}</Link>
        </div>

        {loading ? (
          <div className="ts-loading">{t("common.loading")}</div>
        ) : products.length === 0 ? (
          <div className="ts-empty">
            <span className="ts-empty-icon">📦</span>
            <h3>{t("product.noProducts")}</h3>
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
