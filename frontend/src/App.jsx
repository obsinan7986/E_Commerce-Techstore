import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductPage from "./pages/productpage";
import Products from "./pages/Products";
import CategoryPage from "./pages/categorypage";
import SearchPage from "./pages/searchpage";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Protected customer checkout & shopping pages (Storefront layout)
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Profile from "./pages/Profile";

// Protected operational & account pages (Dashboard layout)
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import PaymentHistory from "./pages/PaymentHistory";
import NotificationsPage from "./pages/NotificationsPage";
import MessageCenter from "./pages/MessageCenter";
import AccountSettingsPage from "./pages/AccountSettingsPage";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminManualPayments from "./pages/AdminManualPayments";
import AdminPaymentSettings from "./pages/AdminPaymentSettings";
import AdminCoupons from "./pages/AdminCoupons";
import AdminMessages from "./pages/AdminMessages";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminBanners from "./pages/AdminBanners";
import AdminProductApproval from "./pages/AdminProductApproval";
import AdminReviews from "./pages/AdminReviews";

// Owner pages
import OwnerRoute from "./components/OwnerRoute";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerUserManagement from "./pages/OwnerUserManagement";
import OwnerKYCReview from "./pages/OwnerKYCReview";

// Seller pages
import SellerRoute from "./components/SellerRoute";
import SellerDashboard from "./pages/SellerDashboard";
import SellerReviews from "./pages/SellerReviews";

// Finance pages
import FinanceRoute from "./components/FinanceRoute";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinancePayments from "./pages/FinancePayments";

// Communication module pages
import MeetingsPage from "./pages/MeetingsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SchedulePage from "./pages/SchedulePage";

// Feature pages
import ImageSearchPage from "./pages/ImageSearchPage";

// Informational pages
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ReturnsPage from "./pages/ReturnsPage";
import ShippingInfoPage from "./pages/ShippingInfoPage";

function App() {
  return (
    <>
    <Routes>
      {/* ── 1. Storefront Public & Consumer Layout ── */}
      <Route element={<MainLayout />}>
        {/* Public Browsing */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/deals" element={<Products initialFilter="deals" />} />
        <Route path="/new-arrivals" element={<Products initialFilter="new-arrivals" />} />
        <Route path="/brands" element={<Products initialFilter="brands" />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/search/:keyword" element={<SearchPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Informational */}
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/shipping-info" element={<ShippingInfoPage />} />

        {/* Feature */}
        <Route path="/image-search" element={<ImageSearchPage />} />

        {/* Cart & Checkout & Customer Profile */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Profile />} />
        </Route>
      </Route>

      {/* ── 2. Enterprise SaaS Dashboard & Operational Layout ── */}
      <Route element={<DashboardLayout />}>
        {/* Unified Account & Customer Management */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account/settings" element={<AccountSettingsPage />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessageCenter />} />
          <Route path="/comm/meetings" element={<MeetingsPage />} />
          <Route path="/comm/announcements" element={<AnnouncementsPage />} />
          <Route path="/comm/schedule" element={<SchedulePage />} />
        </Route>

        {/* Admin Operations */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/manual-payments" element={<AdminManualPayments />} />
          <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/product-approvals" element={<AdminProductApproval />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
        </Route>

        {/* CEO / Owner Governance */}
        <Route element={<OwnerRoute />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/users" element={<OwnerUserManagement />} />
          <Route path="/owner/kyc" element={<OwnerKYCReview />} />
          <Route path="/owner/kyc-review" element={<OwnerKYCReview />} />
        </Route>

        {/* Verified Seller Center */}
        <Route element={<SellerRoute />}>
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/reviews" element={<SellerReviews />} />
        </Route>

        {/* Finance & Split Ledger */}
        <Route element={<FinanceRoute />}>
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/finance/dashboard" element={<FinanceDashboard />} />
          <Route path="/finance/payments" element={<FinancePayments />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </>
  );
}

export default App;
