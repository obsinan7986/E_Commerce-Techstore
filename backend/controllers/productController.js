import Product from "../models/Product.js";
import Order   from "../models/Order.js";


// ==========================================
// Get Products with Search & Filters
// ==========================================
export const getProducts = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    const category = req.query.category
      ? {
          category: req.query.category,
        }
      : {};

    const brand = req.query.brand
      ? {
          brand: req.query.brand,
        }
      : {};

    const priceFilter = {};

    if (req.query.minPrice || req.query.maxPrice) {
      priceFilter.price = {};

      if (req.query.minPrice) {
        priceFilter.price.$gte = Number(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        priceFilter.price.$lte = Number(req.query.maxPrice);
      }
    }

    // Show approved products + legacy products that predate the approval system
    const approvalFilter = {
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    };

    const filter = {
      ...approvalFilter,
      ...keyword,
      ...category,
      ...brand,
      ...priceFilter,
    };

    let sortOption = {};

    switch (req.query.sort) {

      case "priceAsc":
        sortOption = { price: 1 };
        break;

      case "priceDesc":
        sortOption = { price: -1 };
        break;

      case "rating":
        sortOption = { rating: -1 };
        break;

      case "newest":
        sortOption = { createdAt: -1 };
        break;

      default:
        sortOption = { createdAt: -1 };
    }

    const count = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / limit),
      totalProducts: count,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =========================================
// Get Product By ID
// GET /api/products/:id
// =========================================
export const getProductById = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Only show approved + legacy products publicly
    if (product.approvalStatus && product.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =========================================
// Search Products
// GET /api/products/search/:keyword
// =========================================
export const searchProducts = async (req, res) => {
  try {

    const keyword = req.params.keyword;

    const products = await Product.find({
      $or: [
        { name:     { $regex: keyword, $options: "i" } },
        { brand:    { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
      ],
      $and: [
        { $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] },
      ],
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
// Get all unique categories
export const getCategories = async (req, res) => {
  try {

    const categories = await Product.distinct("category");

    res.json(categories);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// =========================================
// Get Products By Category
// GET /api/products/category/:category
// =========================================
export const getProductsByCategory = async (req, res) => {
  try {

    const products = await Product.find({
      category: req.params.category,
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
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
// =========================================
// Create Product
// POST /api/products
// =========================================
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

    if (!name || !description || !brand || !category || !image || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, description, brand, category, image, and price are required.",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero.",
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative.",
      });
    }

    const product = await Product.create({
      name,
      description,
      brand,
      category,
      image,
      price,
      stock: stock ?? 0,
      approvalStatus: "approved",   // admin/owner created products are pre-approved
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

// =========================================
// Update Product
// PUT /api/products/:id
// =========================================
export const updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (req.body.price !== undefined && Number(req.body.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero.",
      });
    }

    if (req.body.stock !== undefined && Number(req.body.stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative.",
      });
    }

    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.image = req.body.image || product.image;
    product.price = req.body.price ?? product.price;
    product.stock = req.body.stock ?? product.stock;

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =========================================
// Delete Product
// DELETE /api/products/:id
// =========================================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const orderReferences = await Order.countDocuments({
      "orderItems.product": req.params.id,
    });

    if (orderReferences > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This product is referenced in existing orders and cannot be deleted. Order history is preserved.",
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
// Get Related Products
// ======================================

// ======================================
// Get Related Products
// GET /api/products/related/:id
// ======================================

export const getRelatedProducts = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    }).limit(4);

    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      products: relatedProducts,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Get Featured Products
// ======================================

export const getFeaturedProducts = async (req, res) => {
  try {

    const featuredProducts = await Product.find({
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      products: featuredProducts,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =========================================
// Get All Products (Admin)
// GET /api/admin/products
// =========================================
export const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const keyword = (req.query.keyword || "").trim();
    const { category, stockFilter, sort } = req.query;

    const filter = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (category) filter.category = category;

    if (stockFilter === "out") {
      filter.stock = 0;
    } else if (stockFilter === "low") {
      filter.stock = { $gt: 0, $lte: 5 };
    } else if (stockFilter === "in") {
      filter.stock = { $gt: 5 };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "priceAsc") sortOption = { price: 1 };
    if (sort === "priceDesc") sortOption = { price: -1 };
    if (sort === "stockAsc") sortOption = { stock: 1 };
    if (sort === "stockDesc") sortOption = { stock: -1 };
    if (sort === "nameAsc") sortOption = { name: 1 };

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// Update Product Stock (Admin)
// PATCH /api/admin/products/:id/stock
// =========================================
export const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (
      stock === undefined ||
      Number.isNaN(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid non-negative stock value is required.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.stock = Number(stock);
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};