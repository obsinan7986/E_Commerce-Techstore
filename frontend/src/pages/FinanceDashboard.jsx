/**
 * Finance Dashboard — /finance/dashboard
 * Financial overview: revenue, payments, manual verification queue,
 * method breakdown, monthly trend, recent transactions.
 * All data is live from MongoDB — no fake numbers.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  getFinanceDashboard,
  getFinanceReport,
  financeVerifyPayment,
} from "../services/adminservice";
import api, { BASE_URL } from "../services/api";
import Pagination from "../components/Pagination";
import "../styles/financeDashboard.css";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt  = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n) => {
  n = Number(n || 0);
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
       : n >= 1_000     ? (n / 1_000).toFixed(1) + "K"
       : String(n);
};

const payStatusCls = (s) => ({
  Paid:     "fd-badge fd-badge--paid",
  Pending:  "fd-badge fd-badge--pending",
  Failed:   "fd-badge fd-badge--failed",
  Refunded: "fd-badge fd-badge--refunded",
}[s] || "fd-badge");

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [pendingManualOrders, setPendingManualOrders] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(10);

  // Date filters & Excel export
  const [exportPeriod, setExportPeriod] = useState("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Screenshot modal preview
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // Reject modal state
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const screenshotSrc = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleApprovePayout = async (payoutId, amount) => {
    try {
      setApprovingId(payoutId);
      const res = await api.patch(`/finance/payouts/${payoutId}/approve`, { action: "approve" });
      toast.success(res.data?.message || `Payout of ETB ${fmt(amount)} approved and marked paid!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve payout request.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleVerifyManualPayment = async (orderId, action, adminNote = "") => {
    try {
      setVerifyingOrderId(orderId);
      const res = await financeVerifyPayment(orderId, action, adminNote);
      toast.success(res.message || `Payment ${action === "verify" ? "approved & verified" : "rejected"} successfully.`);
      setRejectModalOrder(null);
      setRejectReason("");
      setPendingManualOrders((prev) => prev.filter((o) => o._id !== orderId));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} payment.`);
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = {};
      if (exportPeriod !== "custom") {
        params.period = exportPeriod;
      } else {
        if (exportStartDate) params.startDate = exportStartDate;
        if (exportEndDate) params.endDate = exportEndDate;
      }

      const res = await getFinanceReport(params);
      const rows = res.report || [];
      if (rows.length === 0) {
        toast.info("No transaction records found for the selected date range.");
        return;
      }

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const headers = [
        "Transaction/Order ID",
        "Date & Time",
        "Customer Name",
        "Email",
        "Payment Method",
        "Gross Amount (ETB)",
        "Platform Commission (ETB)",
        "Net Seller Payout (ETB)",
        "Payment Status",
        "Verified By",
      ];

      const csvLines = [
        headers.map(escapeCsv).join(","),
        ...rows.map((r) => [
          escapeCsv(r.orderId),
          escapeCsv(new Date(r.createdAt).toLocaleString("en-US")),
          escapeCsv(r.customerName),
          escapeCsv(r.customerEmail),
          escapeCsv(r.paymentMethod),
          r.grossAmount,
          r.commissionAmount,
          r.sellerNetAmount,
          escapeCsv(r.paymentStatus),
          escapeCsv(r.verifiedBy),
        ].join(",")),
      ];

      const csvString = "\uFEFF" + csvLines.join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `OICT_TechStore_Finance_Report_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} transactions to CSV successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate CSV report.");
    } finally {
      setIsExporting(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getFinanceDashboard();
      setData(res.dashboard);
      setPendingManualOrders(res.dashboard?.pendingManualOrders || []);
      setAllTransactions(res.dashboard?.ledgerTransactions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="fd-page"><div className="fd-loading">Loading…</div></div>;
  if (error)   return (
    <div className="fd-page">
      <div className="fd-error"><p>{error}</p><button onClick={load}>Retry</button></div>
    </div>
  );

  const d = data || {};
  const maxMonthly = Math.max(...(d.monthlyRevenue || []).map(m => m.total), 1);
  const pendingOrders = pendingManualOrders;
  const ledgerList = allTransactions.length > 0 ? allTransactions : (d.ledgerTransactions || []);

  return (
    <div className="fd-page">

      {/* Header Toolbar with Export & Date Filters */}
      <div className="fd-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0F172A" }}>
            Finance &amp; Treasury Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.95rem" }}>
            Welcome, <strong>{user?.fullName}</strong> · Real-time ledger, commission settlement &amp; payment verification
          </p>
        </div>

        {/* Date Filter & Export Controls */}
        <div className="fd-filter-toolbar">
          <select
            className="fd-filter-select"
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
          >
            <option value="all">All Time Transactions</option>
            <option value="today">Today / Daily Report</option>
            <option value="week">This Week (Last 7 Days)</option>
            <option value="month">This Month (Last 30 Days)</option>
            <option value="custom">Specific Date Range</option>
          </select>

          {exportPeriod === "custom" && (
            <>
              <input
                type="date"
                className="fd-date-input"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                title="Start Date"
              />
              <span style={{ color: "#94A3B8" }}>to</span>
              <input
                type="date"
                className="fd-date-input"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                title="End Date"
              />
            </>
          )}

          <button
            type="button"
            className="fd-export-btn"
            onClick={handleExportCsv}
            disabled={isExporting}
          >
            {isExporting ? "⏳ Exporting…" : "📊 Export Daily Transactions to Excel (.csv)"}
          </button>

          <button className="fd-refresh-btn" onClick={load}>↻ Refresh</button>
          <Link to="/finance/payments" className="fd-primary-btn">View All Payments →</Link>
        </div>
      </div>

      {/* KPI Cards — Automated Commission & Ledger Engine */}
      <div className="fd-kpis">
        <div className="fd-kpi fd-kpi--revenue">
          <span className="fd-kpi-icon">💰</span>
          <div>
            <strong>ETB {fmt(d.platformTotalRevenue || d.totalGrossSales || d.totalRevenue)}</strong>
            <span>Total Gross Revenue</span>
            <small>{d.paidCount || 0} settled orders</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--commission">
          <span className="fd-kpi-icon">🏦</span>
          <div>
            <strong style={{ color: "#059669" }}>ETB {fmt(d.platformTotalCommission)}</strong>
            <span>Platform Commission Revenue</span>
            <small>Debited from seller earnings</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--liability">
          <span className="fd-kpi-icon">👥</span>
          <div>
            <strong style={{ color: "#0F172A" }}>ETB {fmt(d.totalSellerNetCredits)}</strong>
            <span>Net Seller Payout Liability</span>
            <small>Pending escrow: ETB {fmt(d.pendingSellerCredits)}</small>
          </div>
        </div>
        <div className="fd-kpi fd-kpi--pending">
          <span className="fd-kpi-icon">⏳</span>
          <div>
            <strong>{d.pendingCount || 0}</strong>
            <span>Pending Payments</span>
            <small>{d.manualPending || 0} manual receipts in queue</small>
          </div>
        </div>
      </div>

      {/* ── Payment Verification & Approval Table (Direct inside FinanceDashboard) ── */}
      <div className="fd-card fd-card--verification" style={{ marginBottom: 20 }}>
        <div className="fd-card-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>📋 Payment Approvals &amp; Verification</span>
              {pendingManualOrders.length > 0 && (
                <span className="fd-badge fd-badge--pending" style={{ fontSize: 12 }}>
                  {pendingManualOrders.length} Pending Approval
                </span>
              )}
            </h2>
            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
              Review manual receipts for Telebirr, CBE Birr, M-Pesa, and Awash Bank. Approving sets status to Paid, confirms the order, and settles CEO commission.
            </span>
          </div>
          <button className="fd-refresh-btn" onClick={load} style={{ fontSize: 12 }}>
            ↻ Refresh Queue
          </button>
        </div>

        {pendingManualOrders.length === 0 ? (
          <div className="fd-empty" style={{ padding: "28px 20px" }}>
            <span style={{ fontSize: 26, display: "block", marginBottom: 6 }}>✅</span>
            No manual payments awaiting verification. All customer receipts are up to date!
          </div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th style={{ color: "#0F172A" }}>Amount (ETB)</th>
                  <th>Receipt Screenshot</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingManualOrders.map((ord) => {
                  const cust = ord.user || {};
                  const isActing = verifyingOrderId === ord._id;
                  const screenshot = ord.manualPayment?.screenshotUrl;

                  return (
                    <tr key={ord._id}>
                      <td>
                        <Link to={`/finance/payments?orderId=${ord._id}`} className="fd-order-link">
                          #{ord._id.toString().slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="fd-customer-cell">
                          <strong>{cust.fullName || "Customer"}</strong>
                          <small>{cust.email || cust.phone || "—"}</small>
                        </div>
                      </td>
                      <td>
                        <span className="fd-badge fd-badge--pending" style={{ fontWeight: 600 }}>
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "1.05rem", color: "#0F172A" }}>
                          ETB {fmt(ord.totalPrice)}
                        </strong>
                      </td>
                      <td>
                        {screenshot ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img
                              src={screenshotSrc(screenshot)}
                              alt="Receipt"
                              className="fd-receipt-thumb"
                              onClick={() => setPreviewScreenshot(screenshotSrc(screenshot))}
                              title="Click to view full receipt"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewScreenshot(screenshotSrc(screenshot))}
                              style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 }}
                            >
                              🔍 View
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: 12 }}>No image attached</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button
                            type="button"
                            className="fd-approve-btn"
                            onClick={() => handleVerifyManualPayment(ord._id, "verify")}
                            disabled={isActing}
                          >
                            {isActing ? "Processing…" : "✓ Approve Payment"}
                          </button>
                          <button
                            type="button"
                            className="fd-reject-btn"
                            onClick={() => {
                              setRejectModalOrder(ord);
                              setRejectReason("");
                            }}
                            disabled={isActing}
                          >
                            ✕ Reject
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
      </div>

      <div className="fd-row">

        {/* Monthly revenue bar chart */}
        <div className="fd-card fd-card--chart">
          <div className="fd-card-header">
            <h2>Monthly Revenue</h2>
            <span>Last 6 months · paid orders only</span>
          </div>
          {!(d.monthlyRevenue?.length) ? (
            <div className="fd-empty">No revenue data yet</div>
          ) : (
            <div className="fd-bar-chart">
              {(d.monthlyRevenue || []).map((m, i) => {
                const pct  = Math.max((m.total / maxMonthly) * 100, 2);
                const lbl  = `${MONTHS[(m._id.month - 1) % 12]} ${String(m._id.year).slice(-2)}`;
                return (
                  <div className="fd-bar-col" key={i}>
                    <div className="fd-bar-tooltip">ETB {fmt(m.total)}<br />{m.count} order{m.count !== 1 ? "s" : ""}</div>
                    <div className="fd-bar" style={{ height: `${pct}%` }} />
                    <span className="fd-bar-label">{lbl}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="fd-card fd-card--methods">
          <div className="fd-card-header">
            <h2>Payment Methods</h2>
            <span>By paid orders</span>
          </div>
          {!(d.methodBreakdown?.length) ? (
            <div className="fd-empty">No data yet</div>
          ) : (
            <div className="fd-method-list">
              {(d.methodBreakdown || []).map((m) => (
                <div className="fd-method-row" key={m._id}>
                  <span className="fd-method-name">{m._id || "Unknown"}</span>
                  <span className="fd-method-count">{m.count} order{m.count !== 1 ? "s" : ""}</span>
                  <span className="fd-method-amt">ETB {fmt(m.total)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Manual verification sub-stats */}
          <div className="fd-manual-stats">
            <h3>Manual Payments</h3>
            <div className="fd-manual-row"><span>⏳ Pending</span><strong>{d.manualPending || 0}</strong></div>
            <div className="fd-manual-row"><span>✓ Verified</span><strong>{d.manualVerified || 0}</strong></div>
            <div className="fd-manual-row"><span>✕ Rejected</span><strong>{d.manualRejected || 0}</strong></div>
          </div>
        </div>

      </div>

      {/* ── Seller Payout Requests Section ── */}
      <div className="fd-card fd-card--payouts" style={{ marginBottom: 20 }}>
        <div className="fd-card-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>💸 Seller Payout Requests</span>
              {(d.pendingPayouts?.length || 0) > 0 && (
                <span className="fd-badge fd-badge--pending" style={{ fontSize: 12 }}>
                  {d.pendingPayouts.length} Pending
                </span>
              )}
            </h2>
            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
              Disburse seller net earnings (after platform CEO commission debit) directly to verified bank accounts or Telebirr
            </span>
          </div>
          <button className="fd-refresh-btn" onClick={load} style={{ fontSize: 12 }}>
            ↻ Refresh Requests
          </button>
        </div>

        {!(d.pendingPayouts?.length) ? (
          <div className="fd-empty" style={{ padding: "30px 20px" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>✅</span>
            All seller payout requests are processed. No pending requests.
          </div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Seller / Store</th>
                  <th>Contact Info</th>
                  <th style={{ color: "#0F172A" }}>Requested Net Payout</th>
                  <th>Payout Destination</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {d.pendingPayouts.map((p) => {
                  const s = p.seller || {};
                  const acct = p.accountDetails || s.payoutAccount || {};
                  const isProcessing = approvingId === p._id;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="fd-customer-cell">
                          <strong>{s.storeName || s.fullName || "Seller"}</strong>
                          <small>{s.fullName && s.storeName ? `Owner: ${s.fullName}` : "Verified Seller"}</small>
                        </div>
                      </td>
                      <td>
                        <div className="fd-customer-cell">
                          <span>{s.email || "—"}</span>
                          <small>{s.phone || acct.telebirrPhone || "—"}</small>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: "1.05rem", color: "#0F172A" }}>
                          ETB {fmt(p.amount)}
                        </strong>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          Net after commission
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                          {acct.bankName && (
                            <div>
                              <strong>{acct.bankName}</strong>
                              <div style={{ fontSize: 12, color: "#4B5563" }}>
                                Acc: {acct.accountNumber || "—"}
                              </div>
                              {acct.accountHolder && (
                                <div style={{ fontSize: 11, color: "#6B7280" }}>
                                  Holder: {acct.accountHolder}
                                </div>
                              )}
                            </div>
                          )}
                          {acct.telebirrPhone && (
                            <div style={{ marginTop: acct.bankName ? 4 : 0, color: "#0284C7" }}>
                              <strong>Telebirr:</strong> {acct.telebirrPhone}
                            </div>
                          )}
                          {!acct.bankName && !acct.telebirrPhone && (
                            <span style={{ color: "#9CA3AF" }}>No account saved</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className="fd-badge fd-badge--pending">
                          ⏳ {p.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="fd-approve-btn"
                          onClick={() => handleApprovePayout(p._id, p.amount)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Processing…" : "✓ Approve & Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Commission & Revenue Split Ledger */}
      <div className="fd-card fd-card--recent">
        <div className="fd-card-header">
          <div>
            <h2>All Transactions &amp; Splits Ledger</h2>
            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
              Live split: debits CEO commission from product price and credits platform finance ledger
            </span>
          </div>
          <Link to="/finance/payments" className="fd-view-all">View all payments →</Link>
        </div>
        {!(ledgerList?.length) ? (
          <div className="fd-empty">No transaction splits recorded yet</div>
        ) : (
          <>
            <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Gross Price</th>
                  <th>Seller(s)</th>
                  <th style={{ color: "#059669" }}>Platform Commission</th>
                  <th style={{ color: "#0F172A" }}>Seller Net Credit</th>
                  <th>Split Settlement</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(ledgerList || []).slice((ledgerPage - 1) * ledgerLimit, ledgerPage * ledgerLimit).map((t) => {
                  const sellers = (t.orderItems || [])
                    .map((item) => item.seller?.fullName)
                    .filter(Boolean);
                  const uniqueSellers = [...new Set(sellers)];
                  const sellerDisplay = uniqueSellers.length > 0 ? uniqueSellers.join(", ") : "Platform Store";
                  const grossVal = t.totalGrossItemsPrice || t.totalPrice || 0;
                  const commVal = t.totalCommissionDebited || 0;
                  const netVal = t.totalSellerNetPayout || (grossVal - commVal);

                  return (
                    <tr key={t._id}>
                      <td>
                        <Link to={`/finance/payments?orderId=${t._id}`} className="fd-order-link">
                          #{t._id.toString().slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="fd-customer-cell">
                          <strong>{t.user?.fullName || "—"}</strong>
                          <small>{t.user?.email || ""}</small>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>ETB {fmt(grossVal)}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#374151" }}>{sellerDisplay}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#059669" }}>
                        + ETB {fmt(commVal)}
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>
                        ETB {fmt(netVal)}
                      </td>
                      <td>
                        {t.isCommissionSettled ? (
                          <span className="fd-badge fd-badge--paid" title="Commission debited to Finance & net credited to Seller">
                            ✓ Settled
                          </span>
                        ) : (
                          <span className="fd-badge fd-badge--pending" title="Awaiting payment confirmation">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={payStatusCls(t.paymentStatus)}>{t.paymentStatus}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={ledgerPage}
            totalItems={ledgerList.length}
            pageSize={ledgerLimit}
            onPageChange={setLedgerPage}
            onPageSizeChange={(newLim) => {
              setLedgerLimit(newLim);
              setLedgerPage(1);
            }}
          />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="fd-quick-links">
        <Link to="/finance/payments" className="fd-quick-link" style={{ "--ql-color": "#2563EB" }}>
          <span>💳</span><div><strong>All Payments</strong><span>View & manage</span></div>
        </Link>
        <Link to="/finance/payments?paymentStatus=Pending" className="fd-quick-link" style={{ "--ql-color": "#D97706" }}>
          <span>⏳</span><div><strong>Pending Payments</strong><span>Awaiting action</span></div>
        </Link>
        <Link to="/finance/payments?paymentStatus=Refunded" className="fd-quick-link" style={{ "--ql-color": "#475569" }}>
          <span>↩</span><div><strong>Refunds</strong><span>Refunded orders</span></div>
        </Link>
      </div>

      {/* ── Receipt Screenshot Preview Modal ── */}
      {previewScreenshot && (
        <div className="fd-modal-backdrop" onClick={() => setPreviewScreenshot(null)}>
          <div className="fd-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, textAlign: "center" }}>
            <button className="fd-modal-close" onClick={() => setPreviewScreenshot(null)}>✕</button>
            <h3 style={{ margin: "0 0 16px", color: "#0F172A", fontSize: "1.1rem" }}>Payment Receipt Screenshot</h3>
            <img
              src={previewScreenshot}
              alt="Payment Receipt"
              style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            />
            <div style={{ marginTop: 16 }}>
              <a
                href={previewScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="fd-primary-btn"
                style={{ display: "inline-block" }}
              >
                ↗ Open Full Resolution in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Manual Payment Note Modal ── */}
      {rejectModalOrder && (
        <div className="fd-modal-backdrop" onClick={() => setRejectModalOrder(null)}>
          <div className="fd-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="fd-modal-close" onClick={() => setRejectModalOrder(null)}>✕</button>
            <h3 style={{ margin: "0 0 8px", color: "#DC2626", fontSize: "1.15rem" }}>
              Reject Payment for Order #{rejectModalOrder._id.toString().slice(-8).toUpperCase()}
            </h3>
            <p style={{ margin: "0 0 16px", color: "#64748B", fontSize: "0.88rem" }}>
              Please specify the reason for rejecting this payment (e.g. invalid transaction ID, unreadable screenshot, incorrect amount). This note will be sent to the customer.
            </p>
            <textarea
              className="fd-date-input"
              rows={4}
              style={{ width: "100%", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="fd-refresh-btn"
                onClick={() => setRejectModalOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fd-reject-btn"
                style={{ padding: "8px 20px" }}
                onClick={() => handleVerifyManualPayment(rejectModalOrder._id, "reject", rejectReason)}
                disabled={verifyingOrderId === rejectModalOrder._id}
              >
                {verifyingOrderId === rejectModalOrder._id ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceDashboard;