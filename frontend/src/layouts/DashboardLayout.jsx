import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import "../styles/dashboardLayout.css";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("techstore_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("techstore_sidebar_collapsed", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  return (
    <div className={`dashboard-shell ${collapsed ? "collapsed" : ""}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="dash-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Enterprise Collapsible Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Workspace */}
      <div className="dashboard-main">
        <DashboardHeader
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
