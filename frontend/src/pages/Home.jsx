import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const [showBanner, setShowBanner] = useState(justRegistered);

  const { data: homeData, isLoading: loading } = useQuery({
    queryKey: ["home-new-arrivals"],
    queryFn: async () => {
      const { data } = await api.get("/products?limit=12&sort=newest");
      return data;
    },
    staleTime: 60000,
  });
  const products = homeData?.products || [];

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
          <h2>{t("nav.newArrivals") || "New Arrivals"}</h2>
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
