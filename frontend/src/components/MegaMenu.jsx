import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getCategories,
  getCategoryProducts,
} from "../services/categoryService";
import "../styles/megamenu.css";
import { resolveImageUrl, handleImageError } from "../utils/imageFallback";

const MegaMenu = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 60000,
  });

  useEffect(() => {
    if (catData) {
      const categoryList = Array.isArray(catData)
        ? catData
        : catData.categories || [];
      setCategories(categoryList);
      if (categoryList.length > 0 && !activeCategory) {
        loadProducts(categoryList[0]);
      }
    }
  }, [catData]);

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
                  src={resolveImageUrl(product.image, "product")}
                  alt={product.name}
                  onError={(e) => handleImageError(e, "product")}
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
