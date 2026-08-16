import { useState } from "react";
import "../styles/ProductGallery.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

const resolve = (img) =>
  img?.startsWith("http") ? img : `${BASE}${img}`;

const ProductGallery = ({ product }) => {
  const main = resolve(product.image);
  // Real implementation uses only the one image the product has.
  // Thumbnails show the same image (duplicates removed visually).
  const images = [main];

  const [selected, setSelected] = useState(main);

  return (
    <div className="gallery">
      {/* Main image */}
      <div className="gallery-main">
        <img
          src={selected}
          alt={product.name}
          onError={(e) => { e.target.style.opacity = "0.2"; }}
        />
      </div>

      {/* Thumbnails — only show when more than 1 image */}
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`thumb${selected === img ? " active" : ""}`}
              onClick={() => setSelected(img)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt="" onError={(e) => { e.target.style.opacity = "0"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
