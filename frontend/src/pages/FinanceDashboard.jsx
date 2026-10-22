import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api, { BASE_URL } from '../services/api';
import '../styles/financeDashboard.css';

export default function FinanceDashboard() {
  // 1. Declare all necessary states cleanly so nothing is ever undefined
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    pendingCount: 0,
    paidCount: 0,
  });
  const [pendingManualOrders, setPendingManualOrders] = useState([]);
  const [unconfirmedOnlineOrders, setUnconfirmedOnlineOrders] = useState([]);
  const [paidTransactions, setPaidTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [exporting, setExporting] = useState(false);

  // 2. Fetch finance data from backend on mount
  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/finance/dashboard');
      const d = res.data?.dashboard || res.data || {};

      setStats({
        totalRevenue: d.platformTotalRevenue ?? d.totalGrossSales ?? d.totalRevenue ?? res.data?.stats?.totalRevenue ?? 0,
        platformCommission: d.platformTotalCommission ?? res.data?.stats?.platformCommission ?? 0,
        pendingCount: d.pendingCount ?? d.manualPending ?? (res.data?.pendingManualOrders?.length || 0),
        paidCount: d.paidCount ?? res.data?.stats?.paidCount ?? 0,
      });

      setPendingManualOrders(res.data?.pendingManualOrders || d.pendingManualOrders || []);
      setUnconfirmedOnlineOrders(res.data?.unconfirmedOnlineOrders || d.unconfirmedOnlineOrders || []);

      const rawPaid = (d.recentTransactions && d.recentTransactions.length > 0)
        ? d.recentTransactions
        : (d.ledgerTransactions || []);
      const paidRows = rawPaid
        .filter((t) => !t.paymentStatus || /paid/i.test(t.paymentStatus))
        .slice(0, 25);
      setPaidTransactions(paidRows);

      setLoading(false);
    } catch (err) {
      console.error("Error loading finance dashboard:", err);
      let errorMsg = "network error";
      if (err.response?.status) {
        const status = err.response.status;
        const serverMsg = err.response.data?.message || err.response.statusText || "Request failed";
        errorMsg = `Error ${status}: ${serverMsg}`;
      } else if (err.message) {
        errorMsg = `Network error: ${err.message}`;
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  // 3. Handle Payment Approval: ONE call to PUT /finance/payments/:orderId/verify
  const handleApprovePayment = async (orderId) => {
    try {
      setActionLoading(orderId);
      const res = await api.put(`/finance/payments/${orderId}/verify`, { action: "verify" });
      toast.success(res.data?.message || "Payment approved successfully! Commission split triggered.");
      await fetchFinanceData(); // Refresh data
    } catch (err) {
      console.error("Error approving payment:", err);
      const msg = err.response?.data?.message || err.message || "Failed to approve payment.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Excel / CSV Export Functionality via /finance/report
  const exportToCSV = async () => {
    try {
      setExporting(true);
      const res = await api.get('/finance/report', { params: { period: 'all' } });
      const rowsData = res.data?.report || [];

      if (!rowsData || rowsData.length === 0) {
        toast.info("No transaction records available to export.");
        return;
      }

      const headers = "Order ID,Date,Customer Name,Payment Method,Gross Amount (ETB),Platform Commission,Net Payout,Status\n";
      const rows = rowsData.map((r) =>
        `"${r.orderId}","${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}","${(r.customerName || 'N/A').replace(/"/g, '""')}","${r.paymentMethod || '—'}","${r.grossAmount ?? 0}","${r.commissionAmount ?? 0}","${r.sellerNetAmount ?? 0}","${r.paymentStatus || 'Pending'}"`
      ).join("\n");

      const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `OICT_TechStore_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Finance report exported successfully.");
    } catch (err) {
      console.error("Error exporting finance report:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  const getReceiptUrl = (order) => {
    const img = order.receiptImage || order.manualPayment?.screenshotUrl;
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${BASE_URL}${img.startsWith('/') ? img : `/${img}`}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading Finance Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-xl text-left shadow-sm">
          <p className="font-bold text-base mb-1">Failed to load finance data</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchFinanceData} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finance Control Center</h1>
          <p className="text-sm text-gray-500">Manage manual payment verifications, revenue splits, and export daily reports.</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={exporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
        >
          {exporting ? "Exporting..." : "📥 Export Daily Transactions (.csv)"}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <p className="text-sm text-gray-500 font-medium">Gross Revenue</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1 truncate" style={{ whiteSpace: 'nowrap' }}>
            ETB {Number(stats.totalRevenue || 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <p className="text-sm text-gray-500 font-medium">Platform Commission (CEO)</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1 truncate" style={{ whiteSpace: 'nowrap' }}>
            ETB {Number(stats.platformCommission || 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <p className="text-sm text-gray-500 font-medium">Pending Verifications</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {Array.isArray(pendingManualOrders) ? pendingManualOrders.length : 0} Orders
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <p className="text-sm text-gray-500 font-medium">Paid Orders</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {Number(stats.paidCount || 0).toLocaleString()} Orders
          </h3>
        </div>
      </div>

      {/* Payment Approvals & Verification Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Payment Approvals & Verification Queue</h2>
          <p className="text-xs text-gray-500">Review customer receipt screenshots (Telebirr, CBE, Awash) before confirming orders.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method & Amount</th>
                <th className="p-4">Receipt Proof</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {Array.isArray(pendingManualOrders) && pendingManualOrders.length > 0 ? (
                pendingManualOrders.map((order) => {
                  const receiptUrl = getReceiptUrl(order);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-900 font-mono text-xs">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-4 text-gray-700">{order.customer?.name || order.user?.fullName || 'Guest User'}</td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-800">{order.paymentMethod || 'Telebirr'}</span>
                        <div className="text-xs text-gray-500">ETB {Number(order.totalPrice || 0).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        {receiptUrl ? (
                          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs font-semibold">
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">No receipt attached</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => handleApprovePayment(order._id)}
                          disabled={actionLoading === order._id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          {actionLoading === order._id ? "Approving..." : "Approve Payment"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    🎉 All manual payments have been verified! No pending approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Payments Not Yet Confirmed (Read-only amber table) */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="p-6 border-b border-amber-100 bg-amber-50/50">
          <h2 className="text-lg font-bold text-amber-900">Online payments not yet confirmed</h2>
          <p className="text-xs text-amber-700">Chapa payments stuck in pending state for over 15 minutes.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50 text-amber-800 text-xs uppercase tracking-wider">
                <th className="p-4">Order ID</th>
                <th className="p-4">Amount</th>
                <th className="p-4">txRef</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-sm">
              {Array.isArray(unconfirmedOnlineOrders) && unconfirmedOnlineOrders.length > 0 ? (
                unconfirmedOnlineOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-amber-50/30">
                    <td className="p-4 font-medium text-gray-900 font-mono text-xs">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      ETB {Number(order.totalPrice || 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600">
                      {order.paymentResult?.txRef || '—'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-amber-700/70 text-sm">
                    No unconfirmed online orders older than 15 minutes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paid Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Paid Transactions</h2>
          <p className="text-xs text-gray-500">Recent completed and verified orders (latest 25).</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method</th>
                <th className="p-4">Gross</th>
                <th className="p-4">Platform Commission</th>
                <th className="p-4">Seller Net</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {Array.isArray(paidTransactions) && paidTransactions.length > 0 ? (
                paidTransactions.map((order) => {
                  const gross = order.totalPrice ?? order.totalGrossItemsPrice ?? 0;
                  const commission = order.totalCommissionDebited ?? 0;
                  const sellerNet = order.totalSellerNetPayout ?? (gross - commission);
                  const customerName = order.user?.fullName || order.customer?.name || 'Customer';

                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-900 font-mono text-xs">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-gray-800 font-medium">
                        {customerName}
                      </td>
                      <td className="p-4 text-gray-600">
                        {order.paymentMethod || '—'}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        ETB {Number(gross).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-blue-600">
                        ETB {Number(commission).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-emerald-600">
                        ETB {Number(sellerNet).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                          {order.paymentStatus || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    No paid transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}