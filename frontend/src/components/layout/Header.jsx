import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header
      style={{
        background: "#222",
        color: "#fff",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2>Tech E-Commerce</h2>

      <nav style={{ display: "flex", gap: "20px" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Home
        </Link>

        <Link to="/cart" style={{ color: "white", textDecoration: "none" }}>
          Cart
        </Link>

        <Link to="/wishlist" style={{ color: "white", textDecoration: "none" }}>
          Wishlist
        </Link>

        <Link to="/orders" style={{ color: "white", textDecoration: "none" }}>
          Orders
        </Link>

        <Link to="/login" style={{ color: "white", textDecoration: "none" }}>
          Login
        </Link>

        <Link to="/register" style={{ color: "white", textDecoration: "none" }}>
          Register
        </Link>
      </nav>
    </header>
  );
};

export default Header;