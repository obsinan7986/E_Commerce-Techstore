import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  getCategoryProducts,
} from "../services/categoryService";
import "../styles/megamenu.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const MegaMenu = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        const categoryList = Array.isArray(data)
          ? data
          : data.categories || [];

        setCategories(categoryList);

        if (categoryList.length > 0) {
          loadProducts(categoryList[0]);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  const loadProducts = async (category) => {
    try {
      setActiveCategory(category);

      const data = await getCategoryProducts(category);

      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to load category products:", error);
      setProducts([]);
    }
  };

  return (
    <div className="mega-menu">
      {/* Categories */}
      <div className="category-list">
        {categories.length === 0 ? (
          <div className="menu-loading">Loading...</div>
        ) : (
          categories.map((category) => (
            <Link
              key={category}
              to={`/category/${encodeURIComponent(category)}`}
              className={`category-item ${
                activeCategory === category ? "active" : ""
              }`}
              onMouseEnter={() => loadProducts(category)}
              onClick={() => loadProducts(category)}
            >
              {category}
            </Link>
          ))
        )}
      </div>

      {/* Products */}
      <div className="product-preview">
        {products.length === 0 ? (
          <div className="menu-empty">
            No products found.
          </div>
        ) : (
          products.slice(0, 6).map((product) => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="preview-card"
            >
              <div className="preview-image">
                <img
                  src={product.image?.startsWith("http") ? product.image : `${BASE}${product.image}`}
                  alt={product.name}
                  onError={(e) => { e.target.src = "/placeholder.png"; }}
                />
              </div>

              <h4>{product.name}</h4>

              <p>ETB {product.price?.toLocaleString()}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default MegaMenu;