import { FiMenu, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_PAGE_TITLES } from "../../constants/adminConfig";
import { getInitials } from "../../utils/formatters";

const AdminHeader = ({ title, pathname, onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const pageTitle = title || ADMIN_PAGE_TITLES[pathname] || "Admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-btn"
          aria-label="Toggle menu"
          onClick={onMenuToggle}
        >
          <FiMenu />
        </button>
        <div>
          <h1>{pageTitle}</h1>
          <p>Welcome back, {user?.fullName || "Admin"}</p>
        </div>
      </div>

      <div className="admin-topbar-right">
        <div className="admin-user-chip">
          <span className="admin-user-avatar">
            {getInitials(user?.fullName)}
          </span>
          <div>
            <strong>{user?.fullName}</strong>
            <small>{user?.isAdmin ? "Administrator" : user?.role}</small>
          </div>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={handleLogout}
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
