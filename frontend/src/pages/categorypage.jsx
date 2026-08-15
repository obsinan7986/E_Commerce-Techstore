import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCategoryProducts } from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import "../styles/Products.css";

const CategoryPage = () => {
  const { category } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCategoryProducts(category);

        setProducts(data.products || []);
      } catch (err) {
        console.error("Category page error:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return (
    <main className="products-page">
      <div className="products-header">
        <div>
          <h1>{category}</h1>
          <p>
            <Link to="/products">All Products</Link> › {category}
          </p>
        </div>

        {!loading && !error && (
          <div className="products-count">
            {products.length} Product{products.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {loading ? (
        <div className="products-message">Loading products...</div>
      ) : error ? (
        <div className="products-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="products-message">
          No products found in {category}.
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
};

export default CategoryPage;
