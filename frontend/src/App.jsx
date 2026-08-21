import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
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
import ResetPassword  from "./pages/ResetPassword";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";

// Protected customer pages
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import NotificationsPage from "./pages/NotificationsPage";
import MessageCenter     from "./pages/MessageCenter";

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

// Seller pages
import SellerRoute from "./components/SellerRoute";
import SellerDashboard from "./pages/SellerDashboard";
import SellerReviews from "./pages/SellerReviews";

// Finance pages
import FinanceRoute from "./components/FinanceRoute";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinancePayments from "./pages/FinancePayments";

// Informational pages
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ReturnsPage from "./pages/ReturnsPage";
import ShippingInfoPage from "./pages/ShippingInfoPage";
import AccountPage from "./pages/AccountPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* ── Public ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/search/:keyword"   element={<SearchPage />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

        {/* ── Informational ── */}
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/shipping-info" element={<ShippingInfoPage />} />
        {/* Account sub-pages — protected: require login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>

        {/* ── Protected customer ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/notifications"   element={<NotificationsPage />} />
          <Route path="/messages"        element={<MessageCenter />} />
          {/* Both path formats: App.jsx + Chapa return_url */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
        </Route>

        {/* ── Admin only ── */}
        <Route element={<AdminRoute />}>
          <Route path="/admin"                   element={<AdminDashboard />} />
          <Route path="/admin/dashboard"         element={<AdminDashboard />} />
          <Route path="/admin/analytics"         element={<AdminAnalytics />} />
          <Route path="/admin/orders"            element={<AdminOrders />} />
          <Route path="/admin/products"          element={<AdminProducts />} />
          <Route path="/admin/users"             element={<AdminUsers />} />
          <Route path="/admin/manual-payments"   element={<AdminManualPayments />} />
          <Route path="/admin/payment-settings"  element={<AdminPaymentSettings />} />
          <Route path="/admin/coupons"           element={<AdminCoupons />} />
          <Route path="/admin/messages"          element={<AdminMessages />} />
          <Route path="/admin/notifications"     element={<AdminNotificationsPage />} />
          <Route path="/admin/banners"           element={<AdminBanners />} />
          <Route path="/admin/product-approvals" element={<AdminProductApproval />} />
          <Route path="/admin/reviews"           element={<AdminReviews />} />
        </Route>

        {/* ── Owner only ── */}
        <Route element={<OwnerRoute />}>
          <Route path="/owner"           element={<OwnerDashboard />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/users"     element={<OwnerUserManagement />} />
          <Route path="/owner/kyc"       element={<OwnerUserManagement />} />
        </Route>

        {/* ── Seller only ── */}
        <Route element={<SellerRoute />}>
          <Route path="/seller"           element={<SellerDashboard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/reviews"   element={<SellerReviews />} />
        </Route>

        {/* ── Finance only ── */}
        <Route element={<FinanceRoute />}>
          <Route path="/finance"            element={<FinanceDashboard />} />
          <Route path="/finance/dashboard"  element={<FinanceDashboard />} />
          <Route path="/finance/payments"   element={<FinancePayments />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
