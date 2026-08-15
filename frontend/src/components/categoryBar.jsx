import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useState } from "react";

import "../styles/categorybar.css";

const CategoryBar = () => {

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="category-bar">

      <div
        className="category-wrapper"
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >

        <button className="category-btn">
          <FaBars />
          <span>All Categories</span>
        </button>

        {showMenu && (
          <div className="dropdown-menu">

            <Link to="/category/smartphones">Smartphones</Link>

            <Link to="/category/laptops">Laptops</Link>

            <Link to="/category/tablets">Tablets</Link>

            <Link to="/category/accessories">Accessories</Link>

            <Link to="/category/gaming">Gaming</Link>

            <Link to="/category/headphones">Headphones</Link>

            <Link to="/category/speakers">Speakers</Link>

            <Link to="/category/cameras">Cameras</Link>

            <Link to="/category/tvs">Televisions</Link>

            <Link to="/category/watches">Smart Watches</Link>

          </div>
        )}

      </div>

      <Link to="/">Home</Link>

      <Link to="/products">Products</Link>

      <Link to="/deals">Deals</Link>

      <Link to="/contact">Contact</Link>

    </div>
  );
};

export default CategoryBar;