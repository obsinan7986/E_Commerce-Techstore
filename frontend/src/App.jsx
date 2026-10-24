import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerRoute from "./components/OwnerRoute";
import SellerRoute from "./components/SellerRoute";
import FinanceRoute from "./components/FinanceRoute";

// Eager public landing pages
import Home from "./pages/Home";
import Login from "./pages/Login";

// Lazy public pages
const Register = lazy(() => import("./pages/Register"));
const ProductPage = lazy(() => import("./pages/productpage"));
const Products = lazy(() => import("./pages/Products"));
const CategoryPage = lazy(() => import("./pages/categorypage"));
const SearchPage = lazy(() => import("./pages/searchpage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy protected customer checkout & shopping pages (Storefront layout)
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const Profile = lazy(() => import("./pages/Profile"));

// Lazy protected operational & account pages (Dashboard layout)
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const MessageCenter = lazy(() => import("./pages/MessageCenter"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));

// Lazy Admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminManualPayments = lazy(() => import("./pages/AdminManualPayments"));
const AdminPaymentSettings = lazy(() => import("./pages/AdminPaymentSettings"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const AdminBanners = lazy(() => import("./pages/AdminBanners"));
const AdminProductApproval = lazy(() => import("./pages/AdminProductApproval"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));

// Lazy Owner pages
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const OwnerUserManagement = lazy(() => import("./pages/OwnerUserManagement"));
const OwnerKYCReview = lazy(() => import("./pages/OwnerKYCReview"));

// Lazy Seller pages
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerReviews = lazy(() => import("./pages/SellerReviews"));

// Lazy Finance pages
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));
const FinancePayments = lazy(() => import("./pages/FinancePayments"));

// Lazy Communication module pages
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));

// Lazy Feature pages
const ImageSearchPage = lazy(() => import("./pages/ImageSearchPage"));

// Lazy Informational pages
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const ShippingInfoPage = lazy(() => import("./pages/ShippingInfoPage"));

const RouteSkeleton = () => (
  <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%", minHeight: "60vh" }}>
    <div style={{ height: "28px", width: "220px", background: "rgba(150, 150, 150, 0.12)", borderRadius: "6px", marginBottom: "1.5rem" }} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{ height: "180px", background: "rgba(150, 150, 150, 0.08)", borderRadius: "8px" }} />
      ))}
    </div>
  </div>
);

function App() {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<RouteSkeleton />}>
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
        </Suspense>
      </ErrorBoundary>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </>
  );
}

export default App;
