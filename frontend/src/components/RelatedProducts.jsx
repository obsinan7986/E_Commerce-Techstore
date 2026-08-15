import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "./ProductCard";
import "../styles/relatedProducts.css";

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!productId) return;
    api.get(`/products/related/${productId}`)
      .then(({ data }) => setProducts(data.products || []))
      .catch(console.error);
  }, [productId]);

  if (!products.length) return null;

  return (
    <section className="related-products">
      <div className="section-title-block">
        <h2>Related Products</h2>
        <Link to="/products">See all →</Link>
      </div>
      <div className="related-grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
