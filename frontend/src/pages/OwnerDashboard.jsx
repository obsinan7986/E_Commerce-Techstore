/**
 * Owner Dashboard — /owner/dashboard
 * Quick stats + links to all owner tools + review analytics
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getAdminReviewStats } from "../services/adminservice";
import api, { BASE_URL } from "../services/api";
import "../styles/ownerDashboard.css";

const Stars = ({ rating }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1,2,3,4,5].map((n) => (
      <FaStar key={n} size={11} color={n <= Math.round(rating) ? "#F59E0B" : "#E2E8F0"} />
    ))}
  </span>
);

const imgSrc = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats,        setStats]        = useState(null);
  const [reviewStats,  setReviewStats]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [rvLoading,    setRvLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, pendingKycRes, pendingProductsRes] = await Promise.all([
          api.get("/owner/users?limit=1"),
          api.get("/owner/kyc?status=pending"),
          api.get("/admin/product-approvals?status=pending&limit=1"),
        ]);
        setStats({
          totalUsers:      usersRes.data.total          || 0,
          pendingKyc:      pendingKycRes.data.count     || 0,
          pendingProducts: pendingProductsRes.data.total || 0,
        });
      } catch {
        setStats({ totalUsers: 0, pendingKyc: 0, pendingProducts: 0 });
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      try {
        const res = await getAdminReviewStats();
        setReviewStats(res.stats);
      } catch {
        setReviewStats(null);
      } finally {
        setRvLoading(false);
      }
    };

    load();
    loadReviews();
  }, []);

  const TOOLS = [
    { to: "/owner/users",             icon: "👥", label: "User Management",    desc: "Create, promote, suspend users",   color: "#2563EB" },
    { to: "/owner/kyc",               icon: "🪪", label: "KYC Review",         desc: "Approve or reject seller KYC",     color: "#7C3AED" },
    { to: "/admin/product-approvals", icon: "📦", label: "Product Approvals",  desc: "Review pending seller products",   color: "#0369A1" },
    { to: "/admin/reviews",           icon: "⭐", label: "Review Management",  desc: "Moderate all customer reviews",    color: "#F59E0B" },
    { to: "/comm/meetings",           icon: "📅", label: "Meetings",           desc: "Create & manage all meetings",     color: "#059669" },
    { to: "/comm/announcements",      icon: "📢", label: "Announcements",      desc: "Publish internal announcements",   color: "#7C3AED" },
    { to: "/comm/schedule",           icon: "🗓", label: "Schedule",           desc: "View meeting calendar",            color: "#0369A1" },
    { to: "/admin/dashboard",         icon: "📊", label: "Admin Dashboard",    desc: "Full store management",            color: "#374151" },
    { to: "/admin/analytics",         icon: "📈", label: "Analytics",          desc: "Revenue and order reports",        color: "#D97706" },
    { to: "/admin/orders",            icon: "🛒", label: "Orders",             desc: "Manage all orders",                color: "#DC2626" },
  ];

  const fmt = (n) => Number(n || 0).toFixed(1);

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
            <div><strong>{stats.totalUsers}</strong><span>Total Users</span></div>
          </div>
          <div className="od-stat od-stat--warn">
            <span className="od-stat-icon">🪪</span>
            <div><strong>{stats.pendingKyc}</strong><span>KYC Pending</span></div>
          </div>
          <div className="od-stat od-stat--info">
            <span className="od-stat-icon">📦</span>
            <div><strong>{stats.pendingProducts}</strong><span>Products Pending</span></div>
          </div>
          {reviewStats && (
            <div className="od-stat" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
              <span className="od-stat-icon">⭐</span>
              <div>
                <strong>{reviewStats.totalReviews}</strong>
                <span>Reviews · {fmt(reviewStats.avgRating)}★ avg</span>
              </div>
            </div>
          )}
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

      {/* ── Review Analytics ── */}
      {!rvLoading && reviewStats && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>
            ⭐ Review Analytics
          </h2>

          {/* Rating distribution */}
          <div style={{
            background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
            padding: "16px 20px", marginBottom: 16,
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#374151" }}>
              Rating Distribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {(reviewStats.breakdown || []).map(({ star, count }) => {
                const max = Math.max(...(reviewStats.breakdown || []).map(b => b.count), 1);
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 28, fontSize: 13, color: "#374151", textAlign: "right" }}>{star}★</span>
                    <div style={{ flex: 1, height: 10, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{
                        width: `${(count / max) * 100}%`, height: "100%",
                        background: "#F59E0B", borderRadius: 5,
                        transition: "width 0.3s",
                      }} />
                    </div>
                    <span style={{ width: 28, fontSize: 12, color: "#9CA3AF" }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6B7280" }}>
              {reviewStats.totalReviews} total reviews · avg {fmt(reviewStats.avgRating)} / 5.0
            </p>
          </div>

          {/* Three product grids */}
          <div className="od-tools" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { title: "🏆 Highest Rated",  list: reviewStats.topRated },
              { title: "⚠ Lowest Rated",    list: reviewStats.bottomRated },
              { title: "💬 Most Reviewed",  list: reviewStats.mostReviewed },
            ].map(({ title, list }) => (
              <div key={title} style={{
                background: "#fff", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#111827" }}>
                  {title}
                </h3>
                {(list || []).length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No data yet.</p>
                ) : (list || []).map((p) => (
                  <div key={p._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0", borderBottom: "1px solid #F9FAFB",
                  }}>
                    {p.image && (
                      <img src={imgSrc(p.image)} alt={p.name} style={{
                        width: 36, height: 36, objectFit: "cover",
                        borderRadius: 6, border: "1px solid #E5E7EB", flexShrink: 0,
                      }} onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#111827",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name}
                      </p>
                      <Stars rating={p.rating} />
                      <small style={{ fontSize: 11.5, color: "#9CA3AF" }}>
                        {p.numReviews} review{p.numReviews !== 1 ? "s" : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Link to="/admin/reviews" style={{
              fontSize: 13, color: "#2563EB", fontWeight: 600, textDecoration: "none",
            }}>
              View all reviews →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
