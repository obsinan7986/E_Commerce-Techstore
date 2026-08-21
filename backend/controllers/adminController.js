import User    from "../models/User.js";
import Product from "../models/Product.js";
import Order   from "../models/Order.js";
import Review  from "../models/Review.js";
import createNotification from "../utils/createNotification.js";

// ======================================
// Analytics — single endpoint for the analytics dashboard
// GET /api/admin/analytics
// ======================================
export const getAnalytics = async (req, res) => {
  try {
    const now        = new Date();
    const yearStart  = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueAgg,
      revenueThisMonth,
      revenueLastMonth,
      newCustomersThisMonth,
      newCustomersLastMonth,
      ordersThisMonth,
      ordersLastMonth,
      monthlySales,
      topProducts,
      lowStock,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "Pending" }),
      Order.countDocuments({ orderStatus: "Processing" }),
      Order.countDocuments({ orderStatus: "Shipped" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Order.countDocuments({ orderStatus: "Cancelled" }),

      // total revenue ever
      Order.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // revenue this month
      Order.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // revenue last month
      Order.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      // new customers this month
      User.countDocuments({ role: "customer", createdAt: { $gte: monthStart } }),

      // new customers last month
      User.countDocuments({ role: "customer", createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),

      // orders this month
      Order.countDocuments({ createdAt: { $gte: monthStart } }),

      // orders last month
      Order.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),

      // monthly revenue for current year (last 12 months)
      Order.aggregate([
        { $match: { paymentStatus: "Paid", createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth() + 1, 1) } } },
        {
          $group: {
            _id:          { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue:      { $sum: "$totalPrice" },
            orderCount:   { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // top 8 selling products by total quantity ordered
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $unwind: "$orderItems" },
        {
          $group: {
            _id:           "$orderItems.product",
            name:          { $first: "$orderItems.name" },
            image:         { $first: "$orderItems.image" },
            totalQty:      { $sum: "$orderItems.quantity" },
            totalRevenue:  { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 8 },
      ]),

      // low stock products (≤ 5)
      Product.find({ stock: { $lte: 5 } })
        .select("name image stock category price")
        .sort({ stock: 1 })
        .limit(10),

      // recent 8 orders
      Order.find({})
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(8)
        .select("user totalPrice paymentStatus orderStatus paymentMethod createdAt"),
    ]);

    const totalRevenue          = revenueAgg[0]?.total            || 0;
    const revenueThisMonthVal   = revenueThisMonth[0]?.total      || 0;
    const revenueLastMonthVal   = revenueLastMonth[0]?.total      || 0;
    const pctRevenue            = revenueLastMonthVal > 0
      ? (((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100).toFixed(1)
      : null;
    const pctOrders             = ordersLastMonth > 0
      ? (((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100).toFixed(1)
      : null;
    const pctCustomers          = newCustomersLastMonth > 0
      ? (((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      kpi: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        revenueThisMonth:   revenueThisMonthVal,
        revenueLastMonth:   revenueLastMonthVal,
        pctRevenue,
        ordersThisMonth,
        ordersLastMonth,
        pctOrders,
        newCustomersThisMonth,
        newCustomersLastMonth,
        pctCustomers,
      },
      orderStatus: {
        pending:    pendingOrders,
        processing: processingOrders,
        shipped:    shippedOrders,
        delivered:  deliveredOrders,
        cancelled:  cancelledOrders,
      },
      monthlySales,
      topProducts,
      lowStock,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Dashboard Stats (keep for backward compat)
// ======================================
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      unpaidOrders,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "Pending" }),
      Order.countDocuments({ orderStatus: "Processing" }),
      Order.countDocuments({ orderStatus: "Shipped" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Order.countDocuments({ orderStatus: "Cancelled" }),
      Order.countDocuments({ paymentStatus: "Paid" }),
      Order.countDocuments({ paymentStatus: { $in: ["Pending", "Failed"] } }),
      Order.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.find({})
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // Both `statistics` and `stats` are returned so both old and new
    // dashboard code works without another change.
    const statistics = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      unpaidOrders,
    };

    res.status(200).json({
      success: true,
      statistics,
      stats: statistics,           // legacy alias
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Get All Users (paginated)
// ======================================
export const getAllUsers = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const keyword = (req.query.keyword || "").trim();
    const { role } = req.query;

    const filter = {};
    if (role && ["customer", "admin"].includes(role)) filter.role = role;
    if (keyword) {
      filter.$or = [
        { fullName: { $regex: keyword, $options: "i" } },
        { email:    { $regex: keyword, $options: "i" } },
        { phone:    { $regex: keyword, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Get Single User
// ======================================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Update User Role
// ======================================
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // User model enum is "customer" | "admin"
    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Use 'customer' or 'admin'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Prevent removing the last admin
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot remove the last admin account." });
      }
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin access." });
    }

    user.role    = role;
    user.isAdmin = role === "admin";
    await user.save();

    res.status(200).json({ success: true, message: "User role updated.", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Delete User
// ======================================
export const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot delete the last admin account." });
      }
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Low Stock Products
// ======================================
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Sales Report
// ======================================
export const getSalesReport = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((s, o) => s + o.totalPrice, 0);

    res.status(200).json({
      success: true,
      report: {
        totalOrders:     orders.length,
        paidOrders:      orders.filter((o) => o.paymentStatus === "Paid").length,
        pendingOrders:   orders.filter((o) => o.orderStatus === "Pending").length,
        deliveredOrders: orders.filter((o) => o.orderStatus === "Delivered").length,
        cancelledOrders: orders.filter((o) => o.orderStatus === "Cancelled").length,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Monthly Sales Report
// ======================================
export const getMonthlySalesReport = async (req, res) => {
  try {
    const report = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders:  { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    res.status(200).json({ success: true, monthlySales: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Product Statistics
// ======================================
export const getProductStatistics = async (req, res) => {
  try {
    const products     = await Product.find();
    const totalProducts = products.length;
    const totalStock    = products.reduce((s, p) => s + p.stock, 0);
    const averagePrice  = totalProducts > 0
      ? (products.reduce((s, p) => s + p.price, 0) / totalProducts).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      statistics: {
        totalProducts,
        totalStock,
        averagePrice: Number(averagePrice),
        mostExpensive: totalProducts > 0 ? products.reduce((a, b) => b.price > a.price ? b : a) : null,
        cheapest:      totalProducts > 0 ? products.reduce((a, b) => b.price < a.price ? b : a) : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Admin Customers (customers with order stats)
// ======================================
export const getAdminCustomers = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const keyword = (req.query.keyword || "").trim();

    const filter = { role: "customer" };
    if (keyword) {
      filter.$or = [
        { fullName: { $regex: keyword, $options: "i" } },
        { email:    { $regex: keyword, $options: "i" } },
        { phone:    { $regex: keyword, $options: "i" } },
      ];
    }

    const total     = await User.countDocuments(filter);
    const customers = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const ids   = customers.map((c) => c._id);
    const stats = await Order.aggregate([
      { $match: { user: { $in: ids } } },
      {
        $group: {
          _id:        "$user",
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalPrice", 0] },
          },
        },
      },
    ]);

    const statsMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));

    const enriched = customers.map((c) => {
      const s = statsMap[c._id.toString()] || { orderCount: 0, totalSpent: 0 };
      return { ...c.toObject(), orderCount: s.orderCount, totalSpent: s.totalSpent };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      customers: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Admin Payments (payment records from orders)
// ======================================
export const getAdminPayments = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const keyword = (req.query.keyword || "").trim();
    const { paymentStatus, paymentMethod } = req.query;

    const filter = {};
    if (paymentStatus)  filter.paymentStatus  = paymentStatus;
    if (paymentMethod)  filter.paymentMethod  = paymentMethod;

    if (keyword) {
      const keywordRegex   = { $regex: keyword, $options: "i" };
      const matchingUsers  = await User.find({
        $or: [{ fullName: keywordRegex }, { email: keywordRegex }],
      }).select("_id");

      filter.$or = [
        ...(matchingUsers.length ? [{ user: { $in: matchingUsers.map((u) => u._id) } }] : []),
        { "paymentResult.txRef":         keywordRegex },
        { "paymentResult.transactionId": keywordRegex },
      ];

      if (!filter.$or.length) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, payments: [] });
      }
    }

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("user paymentMethod paymentStatus totalPrice orderStatus paymentResult paidAt createdAt");

    const payments = orders.map((o) => ({
      orderId:       o._id,
      customer:      o.user,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      amount:        o.totalPrice,
      orderStatus:   o.orderStatus,
      txRef:         o.paymentResult?.txRef         || "",
      transactionId: o.paymentResult?.transactionId || "",
      paidAt:        o.paidAt,
      createdAt:     o.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Admin Categories (category stats from products)
// ======================================
export const getAdminCategories = async (req, res) => {
  try {
    const CATEGORIES = [
      "Smartphones", "Laptops", "Tablets", "Accessories", "Gaming",
      "Headphones", "Speakers", "Cameras", "Televisions", "Smartwatches",
    ];

    const counts = await Product.aggregate([
      { $group: { _id: "$category", productCount: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.productCount]));

    const keyword = (req.query.keyword || "").trim();
    let categories = CATEGORIES.map((name) => ({
      name,
      productCount: countMap[name] || 0,
    }));

    if (keyword) {
      const re = new RegExp(keyword, "i");
      categories = categories.filter((c) => re.test(c.name));
    }

    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// Admin Orders (paginated, filterable)
// ======================================
export const getAllOrders = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const keyword = (req.query.keyword || "").trim();
    const { orderStatus, paymentStatus, paymentMethod, sort } = req.query;

    const filter = {};
    if (orderStatus)   filter.orderStatus   = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (keyword) {
      const re = { $regex: keyword, $options: "i" };
      const matchingUsers = await User.find({
        $or: [{ fullName: re }, { email: re }, { phone: re }],
      }).select("_id");

      filter.$or = [
        ...(matchingUsers.length ? [{ user: { $in: matchingUsers.map((u) => u._id) } }] : []),
        { "paymentResult.txRef": re },
      ];

      if (/^[a-f\d]{6,24}$/i.test(keyword)) filter.$or.push({ _id: keyword });
    }

    const SORT_MAP = {
      newest:    { createdAt: -1 },
      oldest:    { createdAt:  1 },
      totalAsc:  { totalPrice: 1 },
      totalDesc: { totalPrice: -1 },
    };

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "fullName email phone")
      .sort(SORT_MAP[sort] || SORT_MAP.newest)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// PRODUCT APPROVAL — List pending products
// GET /api/admin/product-approvals?status=pending|approved|rejected
// ======================================
export const getProductApprovals = async (req, res) => {
  try {
    const page   = Math.max(Number(req.query.page) || 1, 1);
    const limit  = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const status = ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "pending";

    const total    = await Product.countDocuments({ approvalStatus: status });
    const products = await Product.find({ approvalStatus: status })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("seller", "fullName email")
      .populate("reviewedBy", "fullName");

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// APPROVE PRODUCT
// PATCH /api/admin/product-approvals/:id/approve
// ======================================
export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    product.approvalStatus  = "approved";
    product.rejectionReason = "";
    product.reviewedBy      = req.user._id;
    product.reviewedAt      = new Date();
    await product.save();

    res.status(200).json({ success: true, message: "Product approved and now visible in the store.", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// REJECT PRODUCT
// PATCH /api/admin/product-approvals/:id/reject
// Body: { reason }
// ======================================
export const rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    product.approvalStatus  = "rejected";
    product.rejectionReason = reason.trim();
    product.reviewedBy      = req.user._id;
    product.reviewedAt      = new Date();
    await product.save();

    res.status(200).json({ success: true, message: "Product rejected.", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================
// REVIEW MANAGEMENT (Admin/Owner)
// ======================================

// GET /api/admin/reviews
// Query: page, limit, keyword (product name or customer), rating, verified
export const getAllReviews = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 15, 1), 100);
    const { keyword, rating, verified } = req.query;

    // Build match stage
    const match = {};
    if (rating)  match.rating = Number(rating);
    if (verified === "true")  match.verifiedPurchase = true;
    if (verified === "false") match.verifiedPurchase = false;

    // Keyword: search by product name or user name via $lookup
    let reviews;
    let total;

    if (keyword && keyword.trim()) {
      const re = { $regex: keyword.trim(), $options: "i" };
      // First find matching user/product ids
      const [matchingUsers, matchingProducts] = await Promise.all([
        User.find({ $or: [{ fullName: re }, { email: re }] }).select("_id"),
        Product.find({ name: re }).select("_id"),
      ]);
      match.$or = [
        ...(matchingUsers.length    ? [{ user:    { $in: matchingUsers.map(u => u._id) } }] : []),
        ...(matchingProducts.length ? [{ product: { $in: matchingProducts.map(p => p._id) } }] : []),
      ];
      if (!match.$or.length) {
        return res.status(200).json({ success: true, total: 0, page, pages: 0, reviews: [] });
      }
    }

    [total, reviews] = await Promise.all([
      Review.countDocuments(match),
      Review.find(match)
        .populate("user",    "fullName email")
        .populate("product", "name image category")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/reviews/stats
// Returns: total reviews, average rating, breakdown [1–5], top/bottom/most-reviewed products
export const getReviewStats = async (req, res) => {
  try {
    const [
      totalReviews,
      ratingBreakdown,
      topRated,
      bottomRated,
      mostReviewed,
      recentReviews,
      overallAvg,
    ] = await Promise.all([
      Review.countDocuments(),

      Review.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),

      // Top 5 highest-rated products (min 1 review)
      Product.find({ numReviews: { $gt: 0 } })
        .sort({ rating: -1, numReviews: -1 })
        .limit(5)
        .select("name image rating numReviews category"),

      // Bottom 5 lowest-rated products (min 1 review)
      Product.find({ numReviews: { $gt: 0 } })
        .sort({ rating: 1, numReviews: -1 })
        .limit(5)
        .select("name image rating numReviews category"),

      // Top 5 most-reviewed products
      Product.find({ numReviews: { $gt: 0 } })
        .sort({ numReviews: -1 })
        .limit(5)
        .select("name image rating numReviews category"),

      // 5 most recent reviews
      Review.find()
        .populate("user",    "fullName")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .limit(5),

      // Overall average rating
      Review.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
    ]);

    const breakdownMap = Object.fromEntries(ratingBreakdown.map(b => [b._id, b.count]));
    const breakdown    = [5,4,3,2,1].map(star => ({ star, count: breakdownMap[star] || 0 }));
    const avgRating    = overallAvg[0]?.avg || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalReviews,
        avgRating:   Number(avgRating.toFixed(2)),
        breakdown,
        topRated,
        bottomRated,
        mostReviewed,
        recentReviews,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
