/**
 * Seller Dashboard — /seller & /seller/dashboard
 * Manage products, view approval statuses, live CEO commission calculations, and sales ledger.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiGrid,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCreditCard,
  FiShield,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import api, { BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/sellerDashboard.css";

const CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Accessories",
  "Gaming",
  "Headphones",
  "Speakers",
  "Cameras",
  "Televisions",
  "Smartwatches",
];

const STATUS_LABEL = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLS = {
  pending: "ps--pending",
  approved: "ps--approved",
  rejected: "ps--rejected",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  brand: "",
  category: "Smartphones",
  image: "",
  price: "",
  stock: "10",
};

const SellerDashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-view tab
  const activeTab = searchParams.get("tab") || "overview";
  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // ── Seller & Governance State ─────────────────────────────
  const isApprovedSeller =
    user?.role === "seller" ||
    user?.role === "owner" ||
    user?.kycStatus === "verified" ||
    user?.kycStatus === "approved";

  const [statsData, setStatsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Products List State ───────────────────────────────────
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // ── Product Add/Edit Form State ───────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const fileRef = useRef(null);

  // ── Delete confirmation ───────────────────────────────────
  const [confirmId, setConfirmId] = useState(null);

  // ── Payout Request State ──────────────────────────────────
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutBank, setPayoutBank] = useState("Commercial Bank of Ethiopia (CBE)");
  const [payoutAccNumber, setPayoutAccNumber] = useState("");
  const [payoutAccHolder, setPayoutAccHolder] = useState("");
  const [payoutTelebirr, setPayoutTelebirr] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");
  const [payoutErr, setPayoutErr] = useState("");

  // Number formatting helper
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ── Load Stats and Sales ──────────────────────────────────
  const loadDashboardData = async () => {
    try {
      setStatsLoading(true);
      const [salesRes, statsRes] = await Promise.allSettled([
        api.get("/seller/sales"),
        api.get("/seller/dashboard"),
      ]);

      if (salesRes.status === "fulfilled" && salesRes.value?.data?.success) {
        setSalesData(salesRes.value.data);
      }
      if (statsRes.status === "fulfilled" && statsRes.value?.data?.success) {
        setStatsData(statsRes.value.data.stats);
        if (statsRes.value.data.stats?.payoutAccount) {
          const pa = statsRes.value.data.stats.payoutAccount;
          if (pa.bankName) setPayoutBank(pa.bankName);
          if (pa.accountNumber) setPayoutAccNumber(pa.accountNumber);
          if (pa.accountHolder) setPayoutAccHolder(pa.accountHolder);
          if (pa.telebirrPhone) setPayoutTelebirr(pa.telebirrPhone);
        }
      }
    } catch (err) {
      console.error("Error loading seller dashboard data:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // ── Load Products Catalog ─────────────────────────────────
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = { page, limit: 12 };
      if (filterStatus) params.approvalStatus = filterStatus;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const { data } = await api.get("/seller/products", { params });
      setProducts(data?.products || []);
      setTotalProducts(data?.total || 0);
      setPages(data?.pages || 1);
    } catch (err) {
      console.error("Error loading seller products:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProfile?.();
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, filterStatus, searchKeyword]);

  // Derived agreed commission rate
  const agreedRate = Number(
    statsData?.commissionAgreement?.agreedRate ??
      salesData?.summary?.agreedRate ??
      user?.commissionAgreement?.agreedRate ??
      10
  );

  const commissionType =
    statsData?.commissionAgreement?.commissionType ||
    salesData?.summary?.commissionType ||
    user?.commissionAgreement?.commissionType ||
    "percentage";

  // KPIs
  const grossSales = Number(
    statsData?.kpis?.grossSales ??
      salesData?.summary?.grossSales ??
      salesData?.summary?.totalRevenue ??
      0
  );

  const platformCommissionDebited = Number(
    statsData?.kpis?.totalCommissionDebited ??
      salesData?.summary?.totalCommissionDebited ??
      0
  );

  const availableCredits = Number(
    statsData?.kpis?.sellerCredits ??
      salesData?.summary?.sellerCredits ??
      user?.sellerCredits ??
      0
  );

  const totalProductsListed = Number(
    statsData?.kpis?.totalProducts ?? totalProducts ?? products.length ?? 0
  );

  const approvedProductsCount = Number(statsData?.kpis?.approvedProducts ?? 0);
  const pendingProductsCount = Number(statsData?.kpis?.pendingProducts ?? 0);

  // ── Image Upload ──────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, image: data.image }));
    } catch {
      setFormErr("Image upload failed. Please try a valid image file.");
    } finally {
      setUploading(false);
    }
  };

  // ── Open Create / Edit ────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreview("");
    setFormErr("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      brand: p.brand,
      category: p.category || "Smartphones",
      image: p.image || "",
      price: String(p.price || ""),
      stock: String(p.stock || "0"),
    });
    setPreview(p.image ? `${BASE_URL}${p.image}` : "");
    setFormErr("");
    setFormSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
  };

  // ── Save Product ──────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setFormErr("");
    setFormSuccess("");

    if (!form.name || !form.description || !form.brand || !form.price) {
      return setFormErr("Name, description, brand, and price are required.");
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
      };

      if (editId) {
        await api.put(`/seller/products/${editId}`, payload);
        setFormSuccess("Product updated and re-submitted for review.");
      } else {
        await api.post("/seller/products", payload);
        setFormSuccess("Product successfully listed and submitted for review!");
        setForm(EMPTY_FORM);
        setPreview("");
      }

      await loadProducts();
      await loadDashboardData();

      if (showModal) {
        setTimeout(() => closeModal(), 1200);
      }
    } catch (err) {
      setFormErr(err.response?.data?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Product ────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/seller/products/${id}`);
      setConfirmId(null);
      await loadProducts();
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  // ── Payout Request ────────────────────────────────────────
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutMsg("");
    setPayoutErr("");

    const reqAmt = Number(payoutAmount);
    if (!reqAmt || reqAmt <= 0) {
      return setPayoutErr("Please enter a valid payout amount in ETB.");
    }
    if (reqAmt > availableCredits) {
      return setPayoutErr(`Payout amount exceeds available net credits (ETB ${fmt(availableCredits)}).`);
    }

    try {
      setPayoutLoading(true);
      const { data } = await api.post("/seller/payout-request", {
        amount: reqAmt,
        bankName: payoutBank,
        accountNumber: payoutAccNumber,
        accountHolder: payoutAccHolder,
        telebirrPhone: payoutTelebirr,
      });

      setPayoutMsg(data?.message || "Payout request submitted successfully!");
      setPayoutAmount("");
      await loadDashboardData();
    } catch (err) {
      setPayoutErr(err.response?.data?.message || "Failed to submit payout request.");
    } finally {
      setPayoutLoading(false);
    }
  };

  // ── Commission Calculator for form ────────────────────────
  const formPriceNum = Number(form.price) || 0;
  const formCommDebited =
    commissionType === "percentage"
      ? Number(((formPriceNum * agreedRate) / 100).toFixed(2))
      : Number(Math.min(formPriceNum, agreedRate).toFixed(2));
  const formNetEarning = Number(Math.max(0, formPriceNum - formCommDebited).toFixed(2));

  // ── KYC Gate fallback if user is truly not an approved seller ─────────
  if (!isApprovedSeller) {
    return (
      <div className="sd-page">
        <div className="sd-kyc-gate">
          {user?.kycStatus === "pending" ? (
            <>
              <span className="sd-gate-icon">⏳</span>
              <h2>Seller KYC Application Under Review</h2>
              <p>
                Your KYC application has been submitted and is currently being reviewed by the CEO / Owner.
                Once approved, you will have immediate full access to list products, view sales, and request payouts.
              </p>
              <Link to="/profile?tab=become-seller" className="sd-btn sd-btn--primary" style={{ textDecoration: "none" }}>
                View Application Status
              </Link>
            </>
          ) : user?.kycStatus === "rejected" ? (
            <>
              <span className="sd-gate-icon">❌</span>
              <h2>KYC Application Rejected</h2>
              <p>
                {user?.kycRejectionReason
                  ? `Reason: ${user.kycRejectionReason}`
                  : "Your application was not approved. You can update your business documents and resubmit."}
              </p>
              <Link to="/profile?tab=become-seller" className="sd-btn sd-btn--primary" style={{ textDecoration: "none" }}>
                Resubmit KYC Application
              </Link>
            </>
          ) : (
            <>
              <span className="sd-gate-icon">🏪</span>
              <h2>KYC Verification Required</h2>
              <p>
                To sell on TechStore Marketplace, please submit your National ID or trade license for verification.
              </p>
              <Link to="/profile?tab=become-seller" className="sd-btn sd-btn--primary" style={{ textDecoration: "none" }}>
                Apply to Become a Seller
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      {/* ── 1. Top Welcome & CEO Commission Agreement Banner ── */}
      <div className="sd-welcome-banner">
        <div className="sd-banner-left">
          <div className="sd-banner-title-row">
            <h1 className="sd-store-title">
              {user?.storeName || user?.fullName || "My Store"}
            </h1>
            <span className="sd-badge-verified">
              <FiCheckCircle size={13} /> Verified Seller
            </span>
            <div className="sd-banner-commission-badge">
              <FiShield size={14} />
              CEO Agreed Platform Commission:{" "}
              <strong>
                {agreedRate}% per sale
              </strong>{" "}
              (Automatically debited to Finance)
            </div>
          </div>
          <p className="sd-banner-sub">
            Welcome back, <strong>{user?.fullName}</strong>! Manage your product catalog, monitor settled orders, and track your wallet credits.
          </p>
        </div>

        <div className="sd-banner-actions">
          <button
            className="sd-btn sd-btn--banner-primary"
            onClick={() => {
              if (activeTab === "add-product") openCreate();
              else setTab("add-product");
            }}
          >
            <FiPlus style={{ marginRight: 6 }} /> Add New Product
          </button>
        </div>
      </div>

      {/* ── 2. 4 Financial & Store KPI Cards ── */}
      <div className="sd-kpi-grid">
        {/* KPI 1: Gross Sales */}
        <div className="sd-kpi-card" style={{ borderTop: "4px solid #2563EB" }}>
          <div className="sd-kpi-top">
            <span className="sd-kpi-label">Gross Product Sales</span>
            <div className="sd-kpi-icon-wrap" style={{ background: "#EFF6FF", color: "#2563EB" }}>
              <FiDollarSign />
            </div>
          </div>
          <div className="sd-kpi-value">ETB {fmt(grossSales)}</div>
          <div className="sd-kpi-sub">
            <span>Total customer checkout volume</span>
          </div>
        </div>

        {/* KPI 2: Platform Commission Debited */}
        <div className="sd-kpi-card" style={{ borderTop: "4px solid #DC2626" }}>
          <div className="sd-kpi-top">
            <span className="sd-kpi-label">Platform Commission Debited</span>
            <div className="sd-kpi-icon-wrap" style={{ background: "#FEF2F2", color: "#DC2626" }}>
              <FiShield />
            </div>
          </div>
          <div className="sd-kpi-value" style={{ color: "#DC2626" }}>
            -ETB {fmt(platformCommissionDebited)}
          </div>
          <div className="sd-kpi-sub">
            <span>-{agreedRate}% CEO Platform Rate</span>
          </div>
        </div>

        {/* KPI 3: Available Net Seller Credits */}
        <div className="sd-kpi-card" style={{ borderTop: "4px solid #10B981" }}>
          <div className="sd-kpi-top">
            <span className="sd-kpi-label">Available Net Credits (Wallet)</span>
            <div className="sd-kpi-icon-wrap" style={{ background: "#ECFDF5", color: "#10B981" }}>
              <FiCreditCard />
            </div>
          </div>
          <div className="sd-kpi-value" style={{ color: "#059669" }}>
            ETB {fmt(availableCredits)}
          </div>
          <div className="sd-kpi-top sd-kpi-action" style={{ marginBottom: 0 }}>
            <span className="sd-kpi-sub">Net ready for disbursement</span>
            <button
              className="sd-btn--payout-sm"
              onClick={() => setTab("earnings")}
            >
              Request Payout
            </button>
          </div>
        </div>

        {/* KPI 4: Total Products Listed */}
        <div className="sd-kpi-card" style={{ borderTop: "4px solid #8B5CF6" }}>
          <div className="sd-kpi-top">
            <span className="sd-kpi-label">Total Products Listed</span>
            <div className="sd-kpi-icon-wrap" style={{ background: "#F5F3FF", color: "#8B5CF6" }}>
              <FiPackage />
            </div>
          </div>
          <div className="sd-kpi-value">{totalProductsListed}</div>
          <div className="sd-kpi-sub">
            <span>
              {approvedProductsCount} Approved · {pendingProductsCount} Pending Approval
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Navigation Tabs Bar ── */}
      <div className="sd-tabs-bar">
        <button
          className={`sd-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          <FiGrid size={15} /> Overview & Quick Actions
        </button>
        <button
          className={`sd-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setTab("products")}
        >
          <FiPackage size={15} /> My Products
          <span className="sd-tab-count">{totalProductsListed}</span>
        </button>
        <button
          className={`sd-tab-btn ${activeTab === "add-product" ? "active" : ""}`}
          onClick={() => setTab("add-product")}
        >
          <FiPlus size={15} /> Add New Product
        </button>
        <button
          className={`sd-tab-btn ${activeTab === "earnings" ? "active" : ""}`}
          onClick={() => setTab("earnings")}
        >
          <FiDollarSign size={15} /> Sales & Commission Ledger
        </button>
        <Link
          to="/seller/reviews"
          className="sd-tab-btn"
          style={{ textDecoration: "none" }}
        >
          <FiStar size={15} /> Product Reviews
        </Link>
      </div>

      {/* ── 4. Sub-View: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="sd-grid-2col">
          {/* Recent Sales / Commission Splits */}
          <div className="sd-card-panel">
            <div className="sd-panel-head">
              <h2 className="sd-panel-title">Recent Product Sales & Commission Splits</h2>
              <button
                className="sd-btn sd-btn--ghost"
                onClick={() => setTab("earnings")}
              >
                View Full Ledger →
              </button>
            </div>

            {salesData?.itemizedSales && salesData.itemizedSales.length > 0 ? (
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Order ID</th>
                      <th>Qty</th>
                      <th>Gross Price</th>
                      <th>Commission (-{agreedRate}%)</th>
                      <th>Net Earning</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.itemizedSales.slice(0, 6).map((sale, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {sale.image ? (
                              <img
                                src={sale.image.startsWith("http") ? sale.image : `${BASE_URL}${sale.image}`}
                                alt={sale.productName}
                                className="sd-prod-thumb"
                                onError={(e) => { e.target.style.opacity = "0.3"; }}
                              />
                            ) : (
                              <div className="sd-prod-ph">📦</div>
                            )}
                            <strong>{sale.productName}</strong>
                          </div>
                        </td>
                        <td>#{String(sale.orderId).slice(-6)}</td>
                        <td>{sale.quantity}</td>
                        <td>ETB {fmt(sale.grossItemTotal)}</td>
                        <td style={{ color: "#DC2626", fontWeight: 700 }}>
                          -ETB {fmt(sale.commissionDebited)}
                        </td>
                        <td style={{ color: "#16A34A", fontWeight: 700 }}>
                          ETB {fmt(sale.sellerNetEarning)}
                        </td>
                        <td>
                          <span
                            className="ps-badge"
                            style={{
                              background: sale.paymentStatus === "Paid" ? "#D1FAE5" : "#FEF3C7",
                              color: sale.paymentStatus === "Paid" ? "#065F46" : "#92400E",
                            }}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sd-empty-state">
                <span className="sd-empty-state-icon">🛒</span>
                <h3>No Orders Recorded Yet</h3>
                <p>
                  As customers purchase your listed tech products, each sale and automatic CEO commission debit will appear right here in real-time.
                </p>
                <button className="sd-btn sd-btn--primary" onClick={() => setTab("add-product")}>
                  + Add Your First Product
                </button>
              </div>
            )}
          </div>

          {/* Store Profile & Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Quick Actions Card */}
            <div className="sd-card-panel" style={{ marginBottom: 0 }}>
              <div className="sd-panel-head">
                <h2 className="sd-panel-title">Quick Actions</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="sd-btn sd-btn--primary"
                  style={{ width: "100%", justifyContent: "flex-start", padding: "11px 16px" }}
                  onClick={() => setTab("add-product")}
                >
                  <FiPlus style={{ marginRight: 8 }} /> List a New Product
                </button>
                <button
                  className="sd-btn sd-btn--ghost"
                  style={{ width: "100%", justifyContent: "flex-start", padding: "11px 16px" }}
                  onClick={() => setTab("products")}
                >
                  <FiPackage style={{ marginRight: 8 }} /> Manage Products Catalog ({totalProductsListed})
                </button>
                <button
                  className="sd-btn sd-btn--ghost"
                  style={{ width: "100%", justifyContent: "flex-start", padding: "11px 16px" }}
                  onClick={() => setTab("earnings")}
                >
                  <FiCreditCard style={{ marginRight: 8 }} /> Request Payout / Wallet Ledger
                </button>
              </div>
            </div>

            {/* Store Status Card */}
            <div className="sd-card-panel" style={{ marginBottom: 0 }}>
              <div className="sd-panel-head">
                <h2 className="sd-panel-title">Store & Governance</h2>
              </div>
              <div className="sd-info-box">
                <div className="sd-info-row">
                  <span className="sd-info-label">Store Name</span>
                  <span className="sd-info-val">{user?.storeName || user?.fullName}</span>
                </div>
                <div className="sd-info-row">
                  <span className="sd-info-label">National ID / License</span>
                  <span className="sd-info-val">{user?.nationalIdNumber || "Verified"}</span>
                </div>
                <div className="sd-info-row">
                  <span className="sd-info-label">Verification Status</span>
                  <span className="sd-info-val" style={{ color: "#16A34A" }}>
                    ✓ Approved & Verified
                  </span>
                </div>
                <div className="sd-info-row">
                  <span className="sd-info-label">Platform Commission Rate</span>
                  <span className="sd-info-val" style={{ color: "#2563EB" }}>
                    {agreedRate}% per sale
                  </span>
                </div>
                <div className="sd-info-row">
                  <span className="sd-info-label">Wallet Balance</span>
                  <span className="sd-info-val" style={{ color: "#16A34A" }}>
                    ETB {fmt(availableCredits)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Sub-View: MY PRODUCTS CATALOG ── */}
      {activeTab === "products" && (
        <div className="sd-card-panel">
          <div className="sd-panel-head">
            <div>
              <h2 className="sd-panel-title">My Products Catalog</h2>
              <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "13px" }}>
                All tech items listed under your seller account. Newly added or edited items are reviewed by store management.
              </p>
            </div>
            <button className="sd-btn sd-btn--primary" onClick={() => setTab("add-product")}>
              <FiPlus style={{ marginRight: 6 }} /> Add New Product
            </button>
          </div>

          {/* Filters & Search */}
          <div className="sd-filters">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220 }}>
              <FiSearch color="#9CA3AF" />
              <input
                type="text"
                className="sd-input"
                placeholder="Search your products by name..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                style={{ width: "100%" }}
              />
            </div>
            <select
              className="sd-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Approval Statuses</option>
              <option value="approved">Approved ({approvedProductsCount})</option>
              <option value="pending">Pending Review ({pendingProductsCount})</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="sd-btn sd-btn--ghost" onClick={loadProducts} title="Refresh list">
              <FiRefreshCw />
            </button>
          </div>

          {loadingProducts ? (
            <div className="sd-loading">Loading products catalog…</div>
          ) : products.length === 0 ? (
            <div className="sd-empty-state">
              <span className="sd-empty-state-icon">📦</span>
              <h3>No Products Found</h3>
              <p>
                {filterStatus || searchKeyword
                  ? "No products matched your search filters. Try clearing your filters or search keyword."
                  : "You haven't listed any products yet. Click below to add your first product to TechStore!"}
              </p>
              <button className="sd-btn sd-btn--primary" onClick={() => setTab("add-product")}>
                + Add New Product
              </button>
            </div>
          ) : (
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Gross Price</th>
                    <th>Commission (-{agreedRate}%)</th>
                    <th>Net Earning</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const price = Number(p.price || 0);
                    const comm =
                      commissionType === "percentage"
                        ? Number(((price * agreedRate) / 100).toFixed(2))
                        : Number(Math.min(price, agreedRate).toFixed(2));
                    const net = Number(Math.max(0, price - comm).toFixed(2));

                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {p.image ? (
                              <img
                                src={p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`}
                                alt={p.name}
                                className="sd-prod-thumb"
                                onError={(e) => { e.target.style.opacity = "0.3"; }}
                              />
                            ) : (
                              <div className="sd-prod-ph">📷</div>
                            )}
                            <div>
                              <strong style={{ display: "block", color: "#0F172A" }}>{p.name}</strong>
                              <span style={{ fontSize: "12px", color: "#64748B" }}>{p.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td>
                          <strong>ETB {fmt(price)}</strong>
                        </td>
                        <td style={{ color: "#DC2626", fontWeight: 700 }}>
                          -ETB {fmt(comm)}
                        </td>
                        <td style={{ color: "#16A34A", fontWeight: 700 }}>
                          ETB {fmt(net)}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: Number(p.stock) > 0 ? "#0F172A" : "#DC2626",
                            }}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`ps-badge ${STATUS_CLS[p.approvalStatus]}`}>
                            {STATUS_LABEL[p.approvalStatus] || p.approvalStatus}
                          </span>
                          {p.approvalStatus === "rejected" && p.rejectionReason && (
                            <div style={{ fontSize: "11px", color: "#DC2626", marginTop: 4 }}>
                              {p.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              className="sd-btn sd-btn--edit"
                              onClick={() => openEdit(p)}
                              title="Edit product"
                            >
                              <FiEdit2 size={13} style={{ marginRight: 4 }} /> Edit
                            </button>
                            <button
                              className="sd-btn sd-btn--delete"
                              onClick={() => setConfirmId(p._id)}
                              title="Delete product"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="sd-pagination">
              <button
                className="sd-btn sd-btn--ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                className="sd-btn sd-btn--ghost"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Sub-View: ADD / EDIT PRODUCT FORM ── */}
      {activeTab === "add-product" && (
        <div className="sd-card-panel" style={{ maxWidth: 840, margin: "0 auto" }}>
          <div className="sd-panel-head">
            <div>
              <h2 className="sd-panel-title">
                {editId ? "Edit Product" : "Add New Marketplace Product"}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "13px" }}>
                Enter product specifications and pricing. The live commission calculator automatically computes the platform fee and your net payout.
              </p>
            </div>
          </div>

          <form className="sd-form" onSubmit={handleSave} noValidate style={{ padding: 0 }}>
            {formErr && <div className="sd-alert">{formErr}</div>}
            {formSuccess && (
              <div className="sd-notice" style={{ background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" }}>
                ✓ {formSuccess}
              </div>
            )}
            {editId && (
              <div className="sd-notice">
                Notice: Editing an approved or pending product resets its status to <strong>Pending Review</strong> so that administrators can verify your updates.
              </div>
            )}

            {/* Product Image */}
            <div className="sd-field">
              <label>Product Image</label>
              <div className="sd-upload" onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="sd-upload-preview" />
                ) : (
                  <div className="sd-upload-ph">
                    <span>📤</span>
                    <span>Click to upload product image</span>
                  </div>
                )}
                {uploading && <div className="sd-upload-overlay">Uploading image…</div>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFile}
              />
            </div>

            <div className="sd-form-row">
              <div className="sd-field" style={{ gridColumn: "span 2" }}>
                <label>Product Name *</label>
                <input
                  className="sd-input"
                  placeholder="e.g. Samsung Galaxy S24 Ultra 512GB"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="sd-field">
                <label>Brand *</label>
                <input
                  className="sd-input"
                  placeholder="e.g. Samsung, Apple, Dell"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="sd-field">
              <label>Product Description *</label>
              <textarea
                className="sd-input sd-textarea"
                rows={3}
                placeholder="Detailed specifications, warranty details, and box contents..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>

            <div className="sd-form-row">
              <div className="sd-field">
                <label>Category *</label>
                <select
                  className="sd-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sd-field">
                <label>Gross Price (ETB) *</label>
                <input
                  className="sd-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>

              <div className="sd-field">
                <label>Stock Quantity</label>
                <input
                  className="sd-input"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>

            {/* Live Real-Time CEO Commission & Net Earning Calculator Card */}
            <div className="sd-calc-card">
              <div className="sd-calc-title">
                <span>💡</span>
                <span>
                  CEO Commission & Net Earning Breakdown ({commissionType === "percentage" ? `${agreedRate}% rate` : `ETB ${agreedRate} fixed`})
                </span>
              </div>
              <div className="sd-calc-grid">
                <div className="sd-calc-item">
                  <span className="sd-calc-label">Customer Price (Gross)</span>
                  <span className="sd-calc-val">ETB {fmt(formPriceNum)}</span>
                </div>
                <div className="sd-calc-item">
                  <span className="sd-calc-label">
                    CEO Commission Debited ({commissionType === "percentage" ? `-${agreedRate}%` : `-ETB ${agreedRate}`})
                  </span>
                  <span className="sd-calc-val sd-calc-val--comm">
                    -ETB {fmt(formCommDebited)}
                  </span>
                </div>
                <div className="sd-calc-item">
                  <span className="sd-calc-label">Your Net Credit per Sale</span>
                  <span className="sd-calc-val sd-calc-val--net">
                    ETB {fmt(formNetEarning)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              {editId && (
                <button
                  type="button"
                  className="sd-btn sd-btn--ghost"
                  onClick={() => {
                    setEditId(null);
                    setForm(EMPTY_FORM);
                    setPreview("");
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="sd-btn sd-btn--primary"
                disabled={saving || uploading}
                style={{ minWidth: 160 }}
              >
                {saving ? "Submitting…" : editId ? "Update Product" : "Submit Product for Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 7. Sub-View: EARNINGS & PAYOUT REQUESTS ── */}
      {activeTab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Wallet Summary Cards */}
          <div className="sd-kpi-grid" style={{ marginBottom: 0 }}>
            <div className="sd-kpi-card" style={{ borderTop: "4px solid #10B981" }}>
              <span className="sd-kpi-label">Available Wallet Balance</span>
              <div className="sd-kpi-value" style={{ color: "#059669" }}>
                ETB {fmt(availableCredits)}
              </div>
              <span className="sd-kpi-sub">Ready to withdraw to bank</span>
            </div>
            <div className="sd-kpi-card" style={{ borderTop: "4px solid #F59E0B" }}>
              <span className="sd-kpi-label">Pending / Processing Payouts</span>
              <div className="sd-kpi-value" style={{ color: "#D97706" }}>
                ETB {fmt(statsData?.kpis?.pendingSellerCredits ?? salesData?.summary?.pendingSellerCredits ?? 0)}
              </div>
              <span className="sd-kpi-sub">Under review by Finance team</span>
            </div>
            <div className="sd-kpi-card" style={{ borderTop: "4px solid #DC2626" }}>
              <span className="sd-kpi-label">Total Commission Contributed</span>
              <div className="sd-kpi-value" style={{ color: "#DC2626" }}>
                ETB {fmt(platformCommissionDebited)}
              </div>
              <span className="sd-kpi-sub">Debited to Platform Revenue</span>
            </div>
            <div className="sd-kpi-card" style={{ borderTop: "4px solid #2563EB" }}>
              <span className="sd-kpi-label">Lifetime Gross Sales</span>
              <div className="sd-kpi-value" style={{ color: "#2563EB" }}>
                ETB {fmt(grossSales)}
              </div>
              <span className="sd-kpi-sub">Total buyer checkout volume</span>
            </div>
          </div>

          {/* Request Payout Form Card */}
          <div className="sd-card-panel">
            <div className="sd-panel-head">
              <div>
                <h2 className="sd-panel-title">Request Payout to Bank or Telebirr</h2>
                <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "13px" }}>
                  Disburse your available seller net credits directly to your verified Ethiopian bank account or Telebirr wallet.
                </p>
              </div>
            </div>

            <form onSubmit={handlePayoutSubmit} className="sd-form" style={{ padding: 0 }}>
              {payoutMsg && (
                <div className="sd-notice" style={{ background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" }}>
                  ✓ {payoutMsg}
                </div>
              )}
              {payoutErr && <div className="sd-alert">{payoutErr}</div>}

              <div className="sd-form-row">
                <div className="sd-field">
                  <label>Payout Amount (ETB) *</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      className="sd-input"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder={`Max: ${fmt(availableCredits)}`}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="sd-btn sd-btn--ghost"
                      onClick={() => setPayoutAmount(String(availableCredits))}
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="sd-field">
                  <label>Bank or Payment Method *</label>
                  <select
                    className="sd-select"
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                  >
                    <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="Telebirr">Telebirr</option>
                    <option value="Awash Bank">Awash Bank</option>
                    <option value="Dashen Bank">Dashen Bank</option>
                    <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                    <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                  </select>
                </div>

                <div className="sd-field">
                  <label>Account Number or Telebirr Phone *</label>
                  <input
                    className="sd-input"
                    placeholder="e.g. 1000123456789 or 0911223344"
                    value={payoutAccNumber || payoutTelebirr}
                    onChange={(e) => {
                      setPayoutAccNumber(e.target.value);
                      if (payoutBank === "Telebirr") setPayoutTelebirr(e.target.value);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="sd-form-row">
                <div className="sd-field" style={{ gridColumn: "span 2" }}>
                  <label>Account Holder Full Name *</label>
                  <input
                    className="sd-input"
                    placeholder="Full legal name as registered on bank account"
                    value={payoutAccHolder || user?.fullName || ""}
                    onChange={(e) => setPayoutAccHolder(e.target.value)}
                    required
                  />
                </div>
                <div className="sd-field" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    className="sd-btn sd-btn--primary"
                    disabled={payoutLoading || availableCredits <= 0}
                    style={{ height: 40 }}
                  >
                    {payoutLoading ? "Submitting…" : "Submit Payout Request"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Full Itemized Sales & Commission Settlement Ledger */}
          <div className="sd-card-panel">
            <div className="sd-panel-head">
              <h2 className="sd-panel-title">Sales & Platform Commission Split Ledger</h2>
            </div>

            {salesData?.itemizedSales && salesData.itemizedSales.length > 0 ? (
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Customer Total</th>
                      <th>CEO Commission (-{agreedRate}%)</th>
                      <th>Net Credited</th>
                      <th>Payment Status</th>
                      <th>Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.itemizedSales.map((sale, idx) => (
                      <tr key={idx}>
                        <td>
                          {sale.createdAt
                            ? new Date(sale.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>
                          <strong>#{String(sale.orderId).slice(-6)}</strong>
                        </td>
                        <td>{sale.productName}</td>
                        <td>{sale.quantity}</td>
                        <td>ETB {fmt(sale.grossItemTotal)}</td>
                        <td style={{ color: "#DC2626", fontWeight: 700 }}>
                          -ETB {fmt(sale.commissionDebited)}
                        </td>
                        <td style={{ color: "#16A34A", fontWeight: 700 }}>
                          ETB {fmt(sale.sellerNetEarning)}
                        </td>
                        <td>
                          <span
                            className="ps-badge"
                            style={{
                              background: sale.paymentStatus === "Paid" ? "#D1FAE5" : "#FEF3C7",
                              color: sale.paymentStatus === "Paid" ? "#065F46" : "#92400E",
                            }}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className="ps-badge"
                            style={{
                              background: sale.isCommissionSettled ? "#D1FAE5" : "#EFF6FF",
                              color: sale.isCommissionSettled ? "#065F46" : "#1D4ED8",
                            }}
                          >
                            {sale.isCommissionSettled ? "Settled to Wallet" : "Pending Order Delivery"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sd-empty-state">
                <span className="sd-empty-state-icon">📊</span>
                <h3>No Ledger Entries Yet</h3>
                <p>
                  Settled sales and CEO commission debits will be itemized here as orders are placed by customers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Edit / Add Modal (when clicking edit from table) ── */}
      {showModal && (
        <div className="sd-overlay" onClick={closeModal}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
              <button className="sd-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form className="sd-form" onSubmit={handleSave} noValidate>
              {formErr && <div className="sd-alert">{formErr}</div>}
              {formSuccess && (
                <div className="sd-notice" style={{ background: "#ECFDF5", color: "#065F46" }}>
                  ✓ {formSuccess}
                </div>
              )}
              {editId && (
                <div className="sd-notice">
                  Editing will reset approval status to <strong>Pending Review</strong>.
                </div>
              )}

              {/* Image */}
              <div className="sd-field">
                <label>Product Image</label>
                <div className="sd-upload" onClick={() => fileRef.current?.click()}>
                  {preview ? (
                    <img src={preview} alt="preview" className="sd-upload-preview" />
                  ) : (
                    <div className="sd-upload-ph">
                      <span>📤</span>
                      <span>Click to upload image</span>
                    </div>
                  )}
                  {uploading && <div className="sd-upload-overlay">Uploading…</div>}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />
              </div>

              <div className="sd-form-row">
                <div className="sd-field" style={{ gridColumn: "span 2" }}>
                  <label>Name *</label>
                  <input
                    className="sd-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="sd-field">
                  <label>Brand *</label>
                  <input
                    className="sd-input"
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="sd-field">
                <label>Description *</label>
                <textarea
                  className="sd-input sd-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <div className="sd-form-row">
                <div className="sd-field">
                  <label>Category *</label>
                  <select
                    className="sd-select"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sd-field">
                  <label>Price (ETB) *</label>
                  <input
                    className="sd-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="sd-field">
                  <label>Stock</label>
                  <input
                    className="sd-input"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
              </div>

              {/* Calculator breakdown */}
              <div className="sd-calc-card">
                <div className="sd-calc-title">
                  <span>💡</span>
                  <span>
                    CEO Commission & Net Price Calculator ({agreedRate}%)
                  </span>
                </div>
                <div className="sd-calc-grid">
                  <div className="sd-calc-item">
                    <span className="sd-calc-label">Product Listing Price</span>
                    <span className="sd-calc-val">ETB {fmt(formPriceNum)}</span>
                  </div>
                  <div className="sd-calc-item">
                    <span className="sd-calc-label">
                      CEO Agreed Commission (-{agreedRate}%)
                    </span>
                    <span className="sd-calc-val sd-calc-val--comm">
                      -ETB {fmt(formCommDebited)}
                    </span>
                  </div>
                  <div className="sd-calc-item">
                    <span className="sd-calc-label">Your Net Earnings</span>
                    <span className="sd-calc-val sd-calc-val--net">
                      ETB {fmt(formNetEarning)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sd-modal-footer">
                <button
                  type="button"
                  className="sd-btn sd-btn--ghost"
                  onClick={closeModal}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sd-btn sd-btn--primary"
                  disabled={saving || uploading}
                >
                  {saving ? "Saving…" : editId ? "Update Product" : "Submit for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 9. Delete Confirmation Dialog ── */}
      {confirmId && (
        <div className="sd-overlay" onClick={() => setConfirmId(null)}>
          <div className="sd-confirm" onClick={(e) => e.stopPropagation()}>
            <span>🗑</span>
            <h3>Delete this product?</h3>
            <p>This action cannot be undone.</p>
            <div className="sd-confirm-actions">
              <button className="sd-btn sd-btn--ghost" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button className="sd-btn sd-btn--delete" onClick={() => handleDelete(confirmId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
