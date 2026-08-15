import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import "../styles/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = {};

        if (category) params.category = category;
        if (sort) params.sort = sort;

        const { data } = await api.get("/products", { params });

        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, sort]);

  return (
    <main className="products-page">
      <div className="products-header">
        <div>
          <h1>All Products</h1>
          <p>Discover our latest technology products.</p>
        </div>

        <div className="products-count">
          {products.length} Products
        </div>
      </div>

      <div className="products-toolbar">
        <div className="category-filter">
          <button
            className={!category ? "active" : ""}
            onClick={() => setCategory("")}
          >
            All
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
          <option value="newest">Newest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {loading ? (
        <div className="products-message">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="products-message">
          No products found.
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Products;