import Product from "../models/Product.js";


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

    const filter = {
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

    res.status(200).json(product);

  } catch (error) {
    res.status(500).json({
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

    const product = await Product.create(req.body);
    if (!req.body.image) {
    return res.status(400).json({
        success: false,
        message: "Product image is required",
    });
}

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({
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
        message: "Product not found",
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

    res.status(200).json(updatedProduct);

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
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// ======================================
// Get Related Products
// ======================================

export const getRelatedProducts = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
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

    const featuredProducts = await Product.find()
      .sort({
        rating: -1,
        numReviews: -1,
      })
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