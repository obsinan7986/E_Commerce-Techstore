import { useEffect, useState, useMemo } from "react";
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

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState(filterParam === "new-arrivals" ? "newest" : "");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (filterParam === "new-arrivals") {
      setSort("newest");
    } else {
      setSort("");
    }
  }, [filterParam]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = { limit: 100 };

        if (category) params.category = category;
        if (sort) params.sort = sort;
        if (filterParam === "new-arrivals" && !sort) params.sort = "newest";
        if (selectedBrand) params.brand = selectedBrand;

        const { data } = await api.get("/products", { params });
        let list = data.products || [];

        // In deals mode, ensure products represent active promotions / discounts
        if (filterParam === "deals") {
          list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        }

        setProducts(list);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, sort, filterParam, selectedBrand]);

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
            {products.length} Products
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
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              badgeType={badgeType}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Products;
