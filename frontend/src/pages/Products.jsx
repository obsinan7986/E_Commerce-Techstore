import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { getDiscount } from "../utils/pricing";
import "../styles/Products.css";

const BRAND_CONFIG = [
  { name: "Apple",    icon: "🍏" },
  { name: "Samsung",  icon: "📱" },
  { name: "Sony",     icon: "🎧" },
  { name: "Dell",     icon: "💻" },
  { name: "HP",       icon: "🖥️" },
  { name: "Acer",     icon: "⚡" },
  { name: "JBL",      icon: "🔊" },
  { name: "Garmin",   icon: "⌚" },
  { name: "Lenovo",   icon: "💼" },
  { name: "Asus",     icon: "🎮" },
  { name: "Canon",    icon: "📷" },
  { name: "Logitech", icon: "🖱️" },
];

const Products = ({ initialFilter = "" }) => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || initialFilter || "";

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState(filterParam === "new-arrivals" ? "newest" : "");
  const [selectedBrand, setSelectedBrand] = useState("");

  const keyword = searchParams.get("keyword") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const categories = [
    "Smartphones",
    "Laptops",
    "Tablets",
    "Accessories",
    "Gaming",
    "Headphones",
    "Speakers",
    "Cameras",
    "Televisions",
    "Smartwatches",
  ];

  // Reset or initialize sort/brand when filterParam changes
  useEffect(() => {
    setSelectedBrand("");
    setCategory("");
    setPage(1);
    if (filterParam === "new-arrivals") {
      setSort("newest");
    } else {
      setSort("");
    }
  }, [filterParam]);

  // Reset page when any filter criteria changes
  useEffect(() => {
    setPage(1);
  }, [category, sort, selectedBrand, keyword, minPrice, maxPrice]);

  const queryParams = {
    page,
    limit: 12,
    category,
    sort,
    filterParam,
    selectedBrand,
    keyword,
    minPrice,
    maxPrice,
  };

  const { data: prodData, isLoading: loading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: async () => {
      const params = { page, limit: 12 };
      if (category) params.category = category;
      if (sort) params.sort = sort;
      if (filterParam === "new-arrivals" && !sort) params.sort = "newest";
      if (selectedBrand) params.brand = selectedBrand;
      if (keyword) params.keyword = keyword;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await api.get("/products", { params });
      return res.data;
    },
    staleTime: 60000,
  });

  const products = prodData?.products || [];
  const totalProducts = prodData?.totalProducts || 0;
  const pages = prodData?.pages || 1;

  // Compute brand counts dynamically from products
  const brandCounts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (p.brand) {
        const k = p.brand.trim().toLowerCase();
        map[k] = (map[k] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Determine badge type for cards
  const badgeType = filterParam === "deals" ? "deals" : filterParam === "new-arrivals" ? "new" : null;
  const discountedCount = useMemo(() => products.filter((p) => getDiscount(p).hasDiscount).length, [products]);

  return (
    <main className="products-page">
      {/* ── 1. Deals HOT Dedicated Banner ── */}
      {filterParam === "deals" && (
        <div className="filter-hero-banner deals-banner">
          <div className="filter-hero-content">
            <span className="filter-hero-pill">🔥 Flash Deals &amp; Discounts</span>
            <h1>Hot Deals &amp; Flash Discounts</h1>
            <p>
              Browse special offers and discounted prices across smartphones, laptops, and tech accessories.
            </p>
          </div>
          <div className="filter-hero-stats">
            <div className="filter-stat-box">
              <span className="filter-stat-num">{discountedCount}</span>
              <span className="filter-stat-lbl">Products on sale</span>
            </div>
            <div className="filter-stat-box">
              <span className="filter-stat-num">{products.length}</span>
              <span className="filter-stat-lbl">Active Deals</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. New Arrivals Dedicated Banner ── */}
      {filterParam === "new-arrivals" && (
        <div className="filter-hero-banner new-arrivals-banner">
          <div className="filter-hero-content">
            <span className="filter-hero-pill">✨ Fresh In Stock</span>
            <h1>New Arrivals — Latest Tech</h1>
            <p>
              Explore our newest cutting-edge releases and next-gen devices strictly sorted by creation date.
              Get the latest electronics first with instant shipping!
            </p>
          </div>
          <div className="filter-hero-stats">
            <div className="filter-stat-box">
              <span className="filter-stat-num">NEW</span>
              <span className="filter-stat-lbl">Latest Releases</span>
            </div>
            <div className="filter-stat-box">
              <span className="filter-stat-num">{products.length}</span>
              <span className="filter-stat-lbl">Fresh Products</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Brands Dedicated Banner & Interactive Brand Directory ── */}
      {filterParam === "brands" && (
        <>
          <div className="filter-hero-banner brands-banner">
            <div className="filter-hero-content">
              <span className="filter-hero-pill">🏷️ Official Brand Partners</span>
              <h1>Official Brand Directory</h1>
              <p>
                Browse verified products directly from top world-class technology brands.
                Click on any brand pill below to filter products instantly.
              </p>
            </div>
            <div className="filter-hero-stats">
              <div className="filter-stat-box">
                <span className="filter-stat-num">{BRAND_CONFIG.length}+</span>
                <span className="filter-stat-lbl">Top Brands</span>
              </div>
              <div className="filter-stat-box">
                <span className="filter-stat-num">100%</span>
                <span className="filter-stat-lbl">Genuine</span>
              </div>
            </div>
          </div>

          <div className="brand-directory-section">
            <div className="brand-directory-header">
              <h3>Filter by Brand</h3>
              {selectedBrand && (
                <button
                  type="button"
                  className="clear-brand-btn"
                  onClick={() => setSelectedBrand("")}
                >
                  ✕ Clear Brand Filter ({selectedBrand})
                </button>
              )}
            </div>
            <div className="brand-directory-grid">
              <button
                type="button"
                className={`brand-pill ${!selectedBrand ? "active" : ""}`}
                onClick={() => setSelectedBrand("")}
              >
                <span className="brand-pill-name">All Brands</span>
                <span className="brand-pill-count">{products.length}</span>
              </button>
              {BRAND_CONFIG.map((b) => {
                const count = brandCounts[b.name.toLowerCase()] || 0;
                const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
                return (
                  <button
                    key={b.name}
                    type="button"
                    className={`brand-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedBrand(isSelected ? "" : b.name)}
                  >
                    <span className="brand-pill-icon">{b.icon}</span>
                    <span className="brand-pill-name">{b.name}</span>
                    {count > 0 && <span className="brand-pill-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── 4. Standard All Products Header ── */}
      {!filterParam && (
        <div className="products-header">
          <div>
            <h1>All Products</h1>
            <p>Discover our latest technology products.</p>
          </div>
          <div className="products-count">
            {totalProducts} Products
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="category-filter">
          <button
            className={!category ? "active" : ""}
            onClick={() => setCategory("")}
          >
            All Categories
          </button>

          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="sort-select"
        >
          <option value="">Sort By</option>
          <option value="newest">Newest First</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {selectedBrand && (
        <div className="brand-filter-status">
          Showing products filtered by brand: <strong>{selectedBrand}</strong>
          <button onClick={() => setSelectedBrand("")} className="clear-link-btn">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="products-message">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="products-message">
          No products found matching the criteria.
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                badgeType={badgeType}
              />
            ))}
          </div>

          {pages > 1 && (
            <div
              className="pagination-bar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginTop: "2.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page <= 1 ? "#f8fafc" : "#ffffff",
                  color: page <= 1 ? "#94a3b8" : "#1e293b",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                Previous
              </button>
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#475569",
                  fontWeight: 500,
                  padding: "0 8px",
                }}
              >
                Page <strong>{page}</strong> of <strong>{pages}</strong> ({totalProducts} items)
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page >= pages ? "#f8fafc" : "#ffffff",
                  color: page >= pages ? "#94a3b8" : "#1e293b",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: page >= pages ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Products;
