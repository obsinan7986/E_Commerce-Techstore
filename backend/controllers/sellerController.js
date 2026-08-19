/**
 * Seller Controller
 *
 * Sellers can:
 *  - View their own products (all approval statuses)
 *  - Create products (status → pending)
 *  - Edit their own products (resets to pending on edit)
 *  - Delete their own products
 *  - View their own sales summary
 *  - Submit / resubmit KYC documents
 *
 * All routes require role = "seller" (or "owner").
 */
import Product from "../models/Product.js";
import Order   from "../models/Order.js";
import User    from "../models/User.js";

// ============================================================
// GET OWN PRODUCTS  –  GET /api/seller/products
// ============================================================
export const sellerGetProducts = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page) || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const { approvalStatus, keyword } = req.query;

    const filter = { seller: req.user._id };
    if (approvalStatus && ["pending","approved","rejected"].includes(approvalStatus))
      filter.approvalStatus = approvalStatus;
    if (keyword) filter.name = { $regex: keyword, $options: "i" };

    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reviewedBy", "fullName");

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// CREATE PRODUCT  –  POST /api/seller/products
// Requires verified KYC
// ============================================================
export const sellerCreateProduct = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);
    if (seller.kycStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "KYC verification required before adding products.",
      });
    }

    const { name, description, brand, category, image, price, stock } = req.body;
    if (!name || !description || !brand || !category || !price) {
      return res.status(400).json({ success: false, message: "name, description, brand, category and price are required." });
    }

    const product = await Product.create({
      name, description, brand, category,
      image:          image || "",
      price:          Number(price),
      stock:          Number(stock) || 0,
      seller:         req.user._id,
      approvalStatus: "pending",   // always pending until admin approves
    });

    res.status(201).json({
      success: true,
      message: "Product submitted for review. It will be visible once approved.",
      product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPDATE OWN PRODUCT  –  PUT /api/seller/products/:id
// Resets approval to pending on every edit
// ============================================================
export const sellerUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found or not yours." });

    const { name, description, brand, category, image, price, stock } = req.body;
    if (name)        product.name        = name;
    if (description) product.description = description;
    if (brand)       product.brand       = brand;
    if (category)    product.category    = category;
    if (image)       product.image       = image;
    if (price  !== undefined) product.price = Number(price);
    if (stock  !== undefined) product.stock = Number(stock);

    // Reset to pending — admin must re-approve any edited product
    product.approvalStatus  = "pending";
    product.rejectionReason = "";
    product.reviewedBy      = null;
    product.reviewedAt      = null;

    await product.save();
    res.status(200).json({ success: true, message: "Product updated and re-submitted for review.", product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// DELETE OWN PRODUCT  –  DELETE /api/seller/products/:id
// ============================================================
export const sellerDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: "Product not found or not yours." });

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SELLER SALES SUMMARY  –  GET /api/seller/sales
// ============================================================
export const sellerGetSales = async (req, res) => {
  try {
    // Find all orders that contain at least one item from this seller's products
    const sellerProductIds = await Product.find({ seller: req.user._id }).distinct("_id");

    const orders = await Order.find({
      "orderItems.product": { $in: sellerProductIds },
      orderStatus: { $nin: ["Cancelled"] },
    })
      .select("orderItems totalPrice paymentStatus orderStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    // Aggregate only the seller's items within each order
    let totalRevenue  = 0;
    let totalUnitsSold = 0;
    const productSales = {};

    for (const order of orders) {
      for (const item of order.orderItems) {
        const pid = item.product?.toString();
        if (!sellerProductIds.map(String).includes(pid)) continue;
        const revenue = item.price * item.quantity;
        totalRevenue  += order.paymentStatus === "Paid" ? revenue : 0;
        totalUnitsSold += item.quantity;
        if (!productSales[pid]) {
          productSales[pid] = { name: item.name, image: item.image, units: 0, revenue: 0 };
        }
        productSales[pid].units   += item.quantity;
        productSales[pid].revenue += order.paymentStatus === "Paid" ? revenue : 0;
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalUnitsSold,
        totalOrders: orders.length,
      },
      topProducts: Object.values(productSales).sort((a, b) => b.units - a.units).slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SUBMIT / UPDATE KYC  –  POST /api/seller/kyc
// Body: { idFront, idBack, selfie }  (upload paths from /api/upload)
// ============================================================
export const sellerSubmitKYC = async (req, res) => {
  try {
    const { idFront, idBack, selfie } = req.body;
    if (!idFront || !idBack || !selfie) {
      return res.status(400).json({ success: false, message: "idFront, idBack and selfie image paths are required." });
    }

    const user = await User.findById(req.user._id);
    if (user.kycStatus === "verified") {
      return res.status(400).json({ success: false, message: "KYC already verified." });
    }

    user.kycDocs   = { idFront, idBack, selfie };
    user.kycStatus = "pending";
    user.kycRejectionReason = "";
    await user.save();

    res.status(200).json({ success: true, message: "KYC documents submitted. Awaiting review." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET OWN KYC STATUS  –  GET /api/seller/kyc
// ============================================================
export const sellerGetKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("kycStatus kycDocs kycRejectionReason kycReviewedAt");
    res.status(200).json({ success: true, kyc: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
