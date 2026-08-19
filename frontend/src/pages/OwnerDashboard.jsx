/**
 * Owner Dashboard — /owner/dashboard
 * Quick stats + links to all owner tools
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/ownerDashboard.css";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, pendingKycRes, pendingProductsRes] = await Promise.all([
          api.get("/owner/users?limit=1"),
          api.get("/owner/kyc?status=pending"),
          api.get("/admin/product-approvals?status=pending&limit=1"),
        ]);
        setStats({
          totalUsers:      usersRes.data.total        || 0,
          pendingKyc:      pendingKycRes.data.count   || 0,
          pendingProducts: pendingProductsRes.data.total || 0,
        });
      } catch {
        setStats({ totalUsers: 0, pendingKyc: 0, pendingProducts: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const TOOLS = [
    { to: "/owner/users",    icon: "👥", label: "User Management",    desc: "Create, promote, suspend users",   color: "#2563EB" },
    { to: "/owner/kyc",      icon: "🪪", label: "KYC Review",         desc: "Approve or reject seller KYC",     color: "#7C3AED" },
    { to: "/admin/product-approvals", icon: "📦", label: "Product Approvals", desc: "Review pending seller products", color: "#0369A1" },
    { to: "/admin/dashboard",icon: "📊", label: "Admin Dashboard",    desc: "Full store management",            color: "#059669" },
    { to: "/admin/analytics",icon: "📈", label: "Analytics",          desc: "Revenue and order reports",        color: "#D97706" },
    { to: "/admin/orders",   icon: "🛒", label: "Orders",             desc: "Manage all orders",                color: "#DC2626" },
  ];

  return (
    <div className="od-page">
      <div className="od-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p>Welcome back, <strong>{user?.fullName}</strong></p>
        </div>
        <span className="od-badge">Owner</span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="od-loading">Loading…</div>
      ) : (
        <div className="od-stats">
          <div className="od-stat">
            <span className="od-stat-icon">👥</span>
            <div>
              <strong>{stats.totalUsers}</strong>
              <span>Total Users</span>
            </div>
          </div>
          <div className="od-stat od-stat--warn">
            <span className="od-stat-icon">🪪</span>
            <div>
              <strong>{stats.pendingKyc}</strong>
              <span>KYC Pending</span>
            </div>
          </div>
          <div className="od-stat od-stat--info">
            <span className="od-stat-icon">📦</span>
            <div>
              <strong>{stats.pendingProducts}</strong>
              <span>Products Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Tool grid */}
      <div className="od-tools">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to} className="od-tool" style={{ "--tool-color": t.color }}>
            <span className="od-tool-icon">{t.icon}</span>
            <div>
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OwnerDashboard;
