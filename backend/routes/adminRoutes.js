import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";

import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getLowStockProducts,
  getSalesReport,
  getMonthlySalesReport,
  getProductStatistics,
  getAdminCustomers,
  getAdminPayments,
  getAdminCategories,
  getAnalytics,
} from "../controllers/adminController.js";

import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../controllers/productController.js";

import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

const adminOnly = [protect, admin];

// Dashboard
router.get("/dashboard",          ...adminOnly, getDashboardStats);
router.get("/analytics",          ...adminOnly, getAnalytics);
router.get("/sales-report",       ...adminOnly, getSalesReport);
router.get("/monthly-sales", ...adminOnly, getMonthlySalesReport);
router.get("/product-statistics", ...adminOnly, getProductStatistics);
router.get("/low-stock", ...adminOnly, getLowStockProducts);

// Categories & customers & payments
router.get("/categories", ...adminOnly, getAdminCategories);
router.get("/customers", ...adminOnly, getAdminCustomers);
router.get("/payments", ...adminOnly, getAdminPayments);

// Products
router.get("/products", ...adminOnly, getAdminProducts);
router.post("/products", ...adminOnly, createProduct);
router.put(
  "/products/:id",
  ...adminOnly,
  validateObjectId(),
  updateProduct
);
router.patch(
  "/products/:id/stock",
  ...adminOnly,
  validateObjectId(),
  updateProductStock
);
router.delete(
  "/products/:id",
  ...adminOnly,
  validateObjectId(),
  deleteProduct
);

// Orders
router.get("/orders", ...adminOnly, getAllOrders);
router.get(
  "/orders/:id",
  ...adminOnly,
  validateObjectId(),
  getOrderById
);
router.put(
  "/orders/:id/status",
  ...adminOnly,
  validateObjectId(),
  updateOrderStatus
);
router.put(
  "/orders/:id/cancel",
  ...adminOnly,
  validateObjectId(),
  cancelOrder
);

// Users
router.get("/users", ...adminOnly, getAllUsers);
router.get(
  "/users/:id",
  ...adminOnly,
  validateObjectId(),
  getUserById
);
router.put(
  "/users/:id/role",
  ...adminOnly,
  validateObjectId(),
  updateUserRole
);
router.delete(
  "/users/:id",
  ...adminOnly,
  validateObjectId(),
  deleteUser
);

export default router;
