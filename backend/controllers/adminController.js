import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getDashboardStats = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();

    const totalProducts = await Product.countDocuments();

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: "Pending",
    });

    const deliveredOrders = await Order.countDocuments({
      orderStatus: "Delivered",
    });

    const paidOrders = await Order.find({
      paymentStatus: "Paid",
    });

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0
    );

    res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully.",
      stats: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        pendingOrders,
        deliveredOrders,
        revenue: totalRevenue,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Get All Products
// ======================================

export const getAllProducts = async (req, res) => {

    try {

        const products = await Product.find().sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
// ======================================
// Create Product
// ======================================

export const createProduct = async (req, res) => {

    try {

        const {
            name,
            description,
            brand,
            category,
            image,
            price,
            stock,
        } = req.body;

        const product = await Product.create({
            name,
            description,
            brand,
            category,
            image,
            price,
            stock,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
// ======================================
// Update Product
// ======================================

// ======================================
// Update Product
// ======================================

export const updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.name = req.body.name || product.name;
    product.description =
      req.body.description || product.description;
    product.brand = req.body.brand || product.brand;
    product.category =
      req.body.category || product.category;
    product.image = req.body.image || product.image;

    if (req.body.price !== undefined) {
      product.price = Number(req.body.price);
    }

    if (req.body.stock !== undefined) {
      product.stock = Number(req.body.stock);
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Delete Product
// ======================================

export const deleteProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });

        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
// ======================================
// Get All Orders (Admin)
// ======================================

export const getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find({})
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Update Order Status (Admin)
// ======================================

export const updateOrderStatus = async (req, res) => {
  try {

    const { orderStatus } = req.body;

    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Get All Users
// ======================================

export const getAllUsers = async (req, res) => {
  try {

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Get Single User
// ======================================

export const getUserById = async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Update User Role
// ======================================

export const updateUserRole = async (req, res) => {
  try {

    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Delete User
// ======================================

export const deleteUser = async (req, res) => {
  try {

    // Prevent admin from deleting their own account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Get Low Stock Products
// ======================================

export const getLowStockProducts = async (req, res) => {
  try {

    const products = await Product.find({
      stock: { $lte: 5 }
    }).sort({
      stock: 1
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Sales Report
// ======================================
export const getSalesReport = async (req, res) => {
  try {

    const orders = await Order.find();

    const totalOrders = orders.length;

    const paidOrders = orders.filter(
      order => order.paymentStatus === "Paid"
    ).length;

    const pendingOrders = orders.filter(
      order => order.orderStatus === "Pending"
    ).length;

    const deliveredOrders = orders.filter(
      order => order.orderStatus === "Delivered"
    ).length;

    const cancelledOrders = orders.filter(
      order => order.orderStatus === "Cancelled"
    ).length;

    const totalRevenue = orders
      .filter(order => order.paymentStatus === "Paid")
      .reduce(
        (sum, order) => sum + order.totalPrice,
        0
      );

    res.status(200).json({
      success: true,
      report: {
        totalOrders,
        paidOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Monthly Sales Report
// ======================================
export const getMonthlySalesReport = async (req, res) => {
  try {

    const report = await Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: {
            $sum: "$totalPrice",
          },
          totalOrders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      monthlySales: report,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Product Statistics
// ======================================
export const getProductStatistics = async (req, res) => {
  try {

    const products = await Product.find();

    const totalProducts = products.length;

    const totalStock = products.reduce(
      (sum, product) => sum + product.stock,
      0
    );

    const averagePrice =
      totalProducts > 0
        ? (
            products.reduce(
              (sum, product) => sum + product.price,
              0
            ) / totalProducts
          ).toFixed(2)
        : 0;

    const mostExpensive =
      totalProducts > 0
        ? products.reduce((prev, current) =>
            current.price > prev.price ? current : prev
          )
        : null;

    const cheapest =
      totalProducts > 0
        ? products.reduce((prev, current) =>
            current.price < prev.price ? current : prev
          )
        : null;

    res.status(200).json({
      success: true,
      statistics: {
        totalProducts,
        totalStock,
        averagePrice: Number(averagePrice),
        mostExpensive,
        cheapest,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};