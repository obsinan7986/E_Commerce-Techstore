import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import { 
    getDashboardStats,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct, 
    getAllOrders,
    updateOrderStatus,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getLowStockProducts,
    getSalesReport,
    getMonthlySalesReport,
    getProductStatistics,

} from "../controllers/adminController.js";

const router = express.Router();
// Dashboard
router.get(
  "/dashboard",
  protect,
  admin,
  getDashboardStats
);

router.get(
    "/sales-report",
    protect,
    admin,
    getSalesReport
);

router.get(
    "/monthly-sales",
    protect,
    admin,
    getMonthlySalesReport
);

router.get(
    "/product-statistics",
    protect,
    admin,
    getProductStatistics
);

router.get(
    "/low-stock",
    protect,
    admin,
    getLowStockProducts
);

// Products
router.get(
    "/products",
    protect,
    admin,
    getAllProducts
);

router.post(
    "/products",
    protect,
    admin,
    createProduct
);

router.put(
    "/products/:id",
    protect,
    admin,
    updateProduct
);

router.delete(
    "/products/:id",
    protect,
    admin,
    deleteProduct
);

// Orders
router.get(
  "/orders",
  protect,
  admin,
  getAllOrders
);
router.put(
  "/orders/:id/status",
  protect,
  admin,
  updateOrderStatus
);
// ======================================
// Users
// ======================================

router.get(
  "/users",
  protect,
  admin,
  getAllUsers
);

router.get(
  "/users/:id",
  protect,
  admin,
  getUserById
);

router.put(
  "/users/:id/role",
  protect,
  admin,
  updateUserRole
);

router.delete(
  "/users/:id",
  protect,
  admin,
  deleteUser
);

export default router;