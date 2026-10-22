import { useState } from "react";
import "../styles/ProductGallery.css";
import { resolveImageUrl, handleImageError, PRODUCT_FALLBACK_SVG } from "../utils/imageFallback";

const ProductGallery = ({ product }) => {
  const main = resolveImageUrl(product?.image, "product");
  // Real implementation uses only the one image the product has.
  // Thumbnails show the same image (duplicates removed visually).
  const images = [main];

  const [selected, setSelected] = useState(main);

  return (
    <div className="gallery">
      {/* Main image */}
      <div className="gallery-main">
        <img
          src={selected || PRODUCT_FALLBACK_SVG}
          alt={product?.name || "Product"}
          onError={(e) => handleImageError(e, "product")}
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
              <img src={img} alt="" onError={(e) => handleImageError(e, "product")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
