import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiPackage,
  FiLayers,
  FiArchive,
  FiUsers,
  FiUserCheck,
  FiCreditCard,
  FiSettings,
} from "react-icons/fi";
import { ADMIN_NAV } from "../../constants/adminConfig";

const ICONS = {
  dashboard: FiGrid,
  orders: FiShoppingBag,
  products: FiPackage,
  categories: FiLayers,
  inventory: FiArchive,
  customers: FiUsers,
  users: FiUserCheck,
  payments: FiCreditCard,
  settings: FiSettings,
  profile: FiSettings,
};

const AdminSidebar = ({ open, onClose }) => {
  const navItems = ADMIN_NAV.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.section }))
  );

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">TS</span>
          <div>
            <strong>TechStore</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {ADMIN_NAV.map((section) => (
            <div key={section.section} className="admin-nav-section">
              <span className="admin-nav-label">{section.section}</span>
              {section.items.map((item) => {
                const Icon = ICONS[item.icon] || FiGrid;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={onClose}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="admin-nav-section">
            <span className="admin-nav-label">Account</span>
            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <FiSettings />
              <span>Profile</span>
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
