import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api, { BASE_URL } from '../services/api';
import '../styles/financeDashboard.css';

export default function FinanceDashboard() {
  // 1. Declare all necessary states cleanly so nothing is ever undefined
  const [stats, setStats] = useState({ totalRevenue: 0, platformCommission: 0, pendingCount: 0 });
  const [pendingManualOrders, setPendingManualOrders] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Fetch finance data from backend on mount
  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || userObj.token || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      let res;
      try {
        res = await api.get('/finance/dashboard');
      } catch {
        res = await axios.get('/api/finance/dashboard', config);
      }

      const d = res.data?.dashboard || res.data || {};
      setStats(
        res.data.stats || {
          totalRevenue: d.platformTotalRevenue || d.totalGrossSales || d.totalRevenue || 0,
          platformCommission: d.platformTotalCommission || 0,
          pendingCount: d.pendingCount || d.manualPending || (d.pendingManualOrders?.length || 0),
        }
      );
      setPendingManualOrders(res.data.pendingManualOrders || res.data.manualOrders || d.pendingManualOrders || []);
      setAllTransactions(res.data.transactions || res.data.orders || d.ledgerTransactions || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading finance dashboard:", err);
      setError("Failed to load finance data. Please check your connection.");
      setLoading(false);
    }
  };

  // 3. Handle Payment Approval
  const handleApprovePayment = async (orderId) => {
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || userObj.token || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        await api.put(`/finance/orders/${orderId}/approve`, { action: "verify" });
      } catch {
        try {
          await api.put(`/finance/payments/${orderId}/verify`, { action: "verify" });
        } catch {
          await axios.put(`/api/finance/orders/${orderId}/approve`, {}, config);
        }
      }
      alert("Payment approved successfully! Commission split triggered.");
      fetchFinanceData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve payment.");
    }
  };

  // 4. Excel / CSV Export Functionality (UTF-8 BOM for Excel compatibility)
  const exportToCSV = () => {
    if (!allTransactions || allTransactions.length === 0) {
      alert("No transaction records available to export.");
      return;
    }

    const headers = "Order ID,Date,Customer Name,Payment Method,Gross Amount (ETB),Platform Commission,Net Payout,Status\n";
    const rows = allTransactions.map(t => 
      `"${t._id}","${new Date(t.createdAt).toLocaleDateString()}","${t.customer?.name || t.user?.fullName || 'N/A'}","${t.paymentMethod || 'Manual'}","${t.totalPrice || t.totalGrossItemsPrice || 0}","${t.commissionAmount || t.totalCommissionDebited || 0}","${t.netSellerPayout || t.totalSellerNetPayout || 0}","${t.paymentStatus || 'Pending'}"`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OICT_TechStore_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReceiptUrl = (order) => {
    const img = order.receiptImage || order.manualPayment?.screenshotUrl;
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${BASE_URL}${img.startsWith('/') ? img : `/${img}`}`;
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading Finance Dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error} <button onClick={fetchFinanceData} className="ml-4 px-4 py-2 bg-blue-600 text-white rounded">Retry</button></div>;

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
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
        >
          📥 Export Daily Transactions (.csv)
        </button>
      </div>

      {/* KPI Metric Cards (Non-clipping) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <td className="p-4 font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
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
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                        >
                          Approve Payment
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
    </div>
  );
}
