import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiExternalLink,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";
import api, { BASE_URL } from "../services/api";
import "../styles/ownerDashboard.css";

const STATUS_TABS = [
  { key: "pending", label: "Pending Review", icon: FiClock },
  { key: "verified", label: "Approved Sellers", icon: FiCheckCircle },
  { key: "rejected", label: "Rejected Submissions", icon: FiXCircle },
  { key: "all", label: "All Sellers", icon: FiUser },
];

const OwnerKYCReview = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Approval modal state
  const [approvingUser, setApprovingUser] = useState(null);
  const [agreedRate, setAgreedRate] = useState(10);
  const [commissionType, setCommissionType] = useState("percentage");
  const [approving, setApproving] = useState(false);

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Document Lightbox modal state
  const [docPreview, setDocPreview] = useState(null); // { url, title }

  // Action feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const loadSellers = async () => {
    try {
      setLoading(true);
      setError("");
      // Query sellers by KYC status
      const params = activeTab === "all" ? {} : { status: activeTab };
      const { data } = await api.get("/owner/kyc", { params });
      setSellers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load KYC submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [activeTab]);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  // ── Open Approval Modal ──────────────────────────────────────
  const openApproveModal = (seller) => {
    setApprovingUser(seller);
    setAgreedRate(seller.commissionAgreement?.agreedRate ?? 10);
    setCommissionType(seller.commissionAgreement?.commissionType || "percentage");
  };

  const handleConfirmApprove = async () => {
    if (!approvingUser) return;
    try {
      setApproving(true);
      await api.patch(`/owner/kyc/${approvingUser._id}/approve`, {
        agreedRate: Number(agreedRate),
        commissionType,
      });
      showNotification("success", `KYC approved for ${approvingUser.fullName} at ${agreedRate}% commission.`);
      setApprovingUser(null);
      await loadSellers();
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to approve KYC.");
    } finally {
      setApproving(false);
    }
  };

  // ── Open Rejection Modal ──────────────────────────────────────
  const openRejectModal = (seller) => {
    setRejectingUser(seller);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason so the seller can re-submit.");
      return;
    }
    try {
      setRejecting(true);
      await api.patch(`/owner/kyc/${rejectingUser._id}/reject`, {
        reason: rejectReason.trim(),
      });
      showNotification("success", `KYC rejected for ${rejectingUser.fullName}. Notification sent.`);
      setRejectingUser(null);
      await loadSellers();
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to reject KYC.");
    } finally {
      setRejecting(false);
    }
  };

  const resolveImgUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className="owner-kyc-page" style={{ padding: "8px 0 40px" }}>
      {/* Action Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.95rem" }}>
            Review seller identity documents, set CEO platform commission rate, and grant store publishing access
          </p>
        </div>
        <button
          onClick={loadSellers}
          className="refresh-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <FiRefreshCw /> ↻ Refresh
        </button>
      </div>

      {/* Global Feedback */}
      {feedback.message && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: "0.95rem",
            fontWeight: 600,
            background: feedback.type === "success" ? "#DCFCE7" : "#FEE2E2",
            color: feedback.type === "success" ? "#166534" : "#991B1B",
            border: `1px solid ${feedback.type === "success" ? "#86EFAC" : "#FCA5A5"}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 18px", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          borderBottom: "2px solid #E2E8F0",
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #2563EB" : "3px solid transparent",
                color: isActive ? "#2563EB" : "#64748B",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.95rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: -2,
              }}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sellers List / Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>Loading seller submissions…</div>
      ) : sellers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px dashed #CBD5E1",
          }}
        >
          <FiCheckCircle size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 6px", color: "#1E293B" }}>No {activeTab} sellers found</h3>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>
            {activeTab === "pending"
              ? "All seller KYC submissions have been verified or addressed."
              : "No records found in this category."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {sellers.map((seller) => {
            const docs = seller.kycDocs || {};
            const idImg = seller.idDocumentImage || docs.idFront;
            const hasDocs = idImg || docs.idBack || docs.selfie;
            const isVerified = seller.kycStatus === "verified" || seller.kycStatus === "approved";
            const isRejected = seller.kycStatus === "rejected";

            return (
              <div
                key={seller._id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Top Seller Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#EFF6FF",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                      }}
                    >
                      {seller.fullName?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1E293B" }}>{seller.fullName}</h3>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background:
                              isVerified
                                ? "#DCFCE7"
                                : isRejected
                                ? "#FEE2E2"
                                : "#FEF3C7",
                            color:
                              isVerified
                                ? "#166534"
                                : isRejected
                                ? "#991B1B"
                                : "#92400E",
                          }}
                        >
                          {seller.kycStatus === "approved" || seller.kycStatus === "verified" ? "APPROVED" : seller.kycStatus || "pending"}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "#F1F5F9",
                            color: "#475569",
                          }}
                        >
                          {seller.role === "customer" ? "Customer (Applying)" : seller.role?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 4, color: "#64748B", fontSize: "0.85rem", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <FiMail /> {seller.email}
                        </span>
                        {seller.phone && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <FiPhone /> {seller.phone}
                          </span>
                        )}
                        {seller.address && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <FiMapPin /> {seller.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Commission Agreement Status */}
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "8px 14px",
                      textAlign: "right",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                      CEO Commission Rate
                    </span>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>
                      {seller.commissionAgreement?.agreedRate ?? 10}%
                    </div>
                  </div>
                </div>

                {/* Business / KYC Meta Information */}
                {(seller.storeName || seller.nationalIdNumber) && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "12px 16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        Business / Store Name
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                        {seller.storeName || "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        National ID / Trade License Number
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                        {seller.nationalIdNumber || "—"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Note if Rejected */}
                {isRejected && seller.kycRejectionReason && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: 8,
                      color: "#991B1B",
                      fontSize: "0.88rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FiAlertTriangle />
                    <span>
                      <strong>Rejection Reason:</strong> {seller.kycRejectionReason}
                    </span>
                  </div>
                )}

                {/* Uploaded Documents Grid */}
                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "#475569", fontWeight: 600 }}>
                    Uploaded Identity & Verification Documents
                  </h4>

                  {!hasDocs ? (
                    <div style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                      No verification documents were attached with this account.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      {/* ID Front */}
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          padding: 10,
                          background: "#FAFAFA",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          National ID / Trade License (Document)
                        </div>
                        {idImg ? (
                          <div
                            onClick={() => setDocPreview({ url: resolveImgUrl(idImg), title: "National ID / Trade License" })}
                            style={{
                              cursor: "pointer",
                              height: 120,
                              borderRadius: 6,
                              overflow: "hidden",
                              background: "#E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            <img
                              src={resolveImgUrl(idImg)}
                              alt="ID Document"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: 4,
                                right: 4,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiEye /> View
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                            Not Provided
                          </div>
                        )}
                      </div>

                      {/* ID Back */}
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          padding: 10,
                          background: "#FAFAFA",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          National ID / Passport (Back)
                        </div>
                        {docs.idBack ? (
                          <div
                            onClick={() => setDocPreview({ url: resolveImgUrl(docs.idBack), title: "National ID (Back)" })}
                            style={{
                              cursor: "pointer",
                              height: 120,
                              borderRadius: 6,
                              overflow: "hidden",
                              background: "#E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            <img
                              src={resolveImgUrl(docs.idBack)}
                              alt="ID Back"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: 4,
                                right: 4,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiEye /> View
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                            Not Provided
                          </div>
                        )}
                      </div>

                      {/* Selfie */}
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          padding: 10,
                          background: "#FAFAFA",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          Verification Selfie
                        </div>
                        {docs.selfie ? (
                          <div
                            onClick={() => setDocPreview({ url: resolveImgUrl(docs.selfie), title: "Verification Selfie" })}
                            style={{
                              cursor: "pointer",
                              height: 120,
                              borderRadius: 6,
                              overflow: "hidden",
                              background: "#E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            <img
                              src={resolveImgUrl(docs.selfie)}
                              alt="Selfie"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: 4,
                                right: 4,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiEye /> View
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                            Not Provided
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    borderTop: "1px solid #F1F5F9",
                    paddingTop: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openRejectModal(seller)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 8,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FiXCircle /> Reject KYC
                  </button>

                  <button
                    type="button"
                    onClick={() => openApproveModal(seller)}
                    style={{
                      padding: "8px 22px",
                      borderRadius: 8,
                      border: "none",
                      background: "#2563EB",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FiCheckCircle /> {isVerified ? "Update Commission" : "Approve KYC"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Approve KYC & Set Commission ── */}
      {approvingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setApprovingUser(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1E293B" }}>
                Approve KYC: {approvingUser.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 14px", color: "#64748B", fontSize: "0.9rem" }}>
              Approve identity documents and set the official CEO-agreed platform commission rate debited from this seller's product sales.
            </p>

            {(approvingUser.storeName || approvingUser.nationalIdNumber) && (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: "0.85rem",
                }}
              >
                <div><strong>Store Name:</strong> {approvingUser.storeName || "N/A"}</div>
                <div style={{ marginTop: 4 }}><strong>National ID / License:</strong> {approvingUser.nationalIdNumber || "N/A"}</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Commission Deduction Model
                </label>
                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="percentage">Percentage per Item Price (%)</option>
                  <option value="fixed">Fixed ETB Fee per Item Sold</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  CEO Agreed Rate ({commissionType === "percentage" ? "%" : "ETB"})
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={agreedRate}
                  onChange={(e) => setAgreedRate(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: "1rem",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: "0.85rem",
                  color: "#1E40AF",
                }}
              >
                Example: On a 1,000 ETB sale, <strong>{agreedRate}%</strong> (
                {(1000 * (Number(agreedRate) / 100)).toFixed(0)} ETB) is debited directly to platform Finance, and{" "}
                <strong>{(1000 * (1 - Number(agreedRate) / 100)).toFixed(0)} ETB</strong> is credited to the seller.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approving}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563EB",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {approving ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Reject KYC ── */}
      {rejectingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setRejectingUser(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#DC2626" }}>
                Reject KYC: {rejectingUser.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 14px", color: "#64748B", fontSize: "0.9rem" }}>
              Please specify why the verification was rejected so the seller can submit clear documents.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. ID document is blurry, name mismatch, or selfie is unclear..."
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Document Lightbox Preview ── */}
      {docPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setDocPreview(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                color: "#FFFFFF",
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>{docPreview.title}</strong>
              <button
                type="button"
                onClick={() => setDocPreview(null)}
                style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: 24, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <img
              src={docPreview.url}
              alt={docPreview.title}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerKYCReview;
