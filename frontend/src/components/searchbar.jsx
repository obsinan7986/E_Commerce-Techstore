import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import "../styles/searchbar.css";

const SearchBar = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/search/${keyword}`);
    }
  };

  return (
    <div className="search-bar">

      <input
        type="text"
        placeholder="Search smartphones, laptops..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <button onClick={handleSubmit}>
        <FaSearch />
      </button>

    </div>
  );
};

export default SearchBar;