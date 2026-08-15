import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/filterSidebar.css";

const FilterSidebar = ({
  filters,
  setFilters,
}) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const { data } = await api.get("/products");

      const products = data.products || [];

      setCategories([
        ...new Set(products.map((p) => p.category)),
      ]);

      setBrands([
        ...new Set(products.map((p) => p.brand)),
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside className="filter-sidebar">

      <h2>Filters</h2>

      {/* Categories */}

      <div className="filter-group">

        <h3>Categories</h3>

        {categories.map((category) => (
          <label key={category}>
            <input
              type="radio"
              name="category"
              checked={filters.category === category}
              onChange={() =>
                setFilters({
                  ...filters,
                  category,
                })
              }
            />

            {category}

          </label>
        ))}

      </div>

      {/* Brands */}

      <div className="filter-group">

        <h3>Brands</h3>

        {brands.map((brand) => (
          <label key={brand}>
            <input
              type="radio"
              name="brand"
              checked={filters.brand === brand}
              onChange={() =>
                setFilters({
                  ...filters,
                  brand,
                })
              }
            />

            {brand}

          </label>
        ))}

      </div>

      {/* Price */}

      <div className="filter-group">

        <h3>Maximum Price</h3>

        <input
          type="range"
          min="0"
          max="5000"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters({
              ...filters,
              maxPrice: e.target.value,
            })
          }
        />

        <p>ETB {Number(filters.maxPrice).toLocaleString()}</p>

      </div>

    </aside>
  );
};

export default FilterSidebar;