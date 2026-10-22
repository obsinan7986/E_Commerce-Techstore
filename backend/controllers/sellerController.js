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
import Review  from "../models/Review.js";
import Payout  from "../models/Payout.js";
import Notification from "../models/Notification.js";

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
// Requires verified / approved KYC or seller / owner role
// ============================================================
export const sellerCreateProduct = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);
    const isApproved =
      seller?.role === "seller" ||
      seller?.role === "owner" ||
      seller?.kycStatus === "verified" ||
      seller?.kycStatus === "approved";

    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: "KYC verification required before adding products.",
      });
    }

    const { name, description, brand, category, image, price, stock, compareAtPrice } = req.body;
    if (!name || !description || !brand || !category || price === undefined) {
      return res.status(400).json({ success: false, message: "name, description, brand, category and price are required." });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than zero." });
    }

    let parsedCompareAt = 0;
    if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== "") {
      parsedCompareAt = Number(compareAtPrice);
      if (isNaN(parsedCompareAt) || (parsedCompareAt !== 0 && parsedCompareAt <= Number(price))) {
        return res.status(400).json({
          success: false,
          message: "Original price must be higher than the selling price.",
        });
      }
    }

    const product = await Product.create({
      name, description, brand, category,
      image:          image || "",
      price:          Number(price),
      compareAtPrice: parsedCompareAt,
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

    const { name, description, brand, category, image, price, stock, compareAtPrice } = req.body;
    const targetPrice = price !== undefined ? Number(price) : product.price;

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than zero." });
    }

    if (compareAtPrice !== undefined) {
      let parsedCompareAt = 0;
      if (compareAtPrice !== null && compareAtPrice !== "") {
        parsedCompareAt = Number(compareAtPrice);
      }
      if (isNaN(parsedCompareAt) || (parsedCompareAt !== 0 && parsedCompareAt <= targetPrice)) {
        return res.status(400).json({
          success: false,
          message: "Original price must be higher than the selling price.",
        });
      }
      product.compareAtPrice = parsedCompareAt;
    } else if (price !== undefined && product.compareAtPrice > 0) {
      if (product.compareAtPrice <= targetPrice) {
        return res.status(400).json({
          success: false,
          message: "Original price must be higher than the selling price.",
        });
      }
    }

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
    const seller = await User.findById(req.user._id);

    // Find all orders that contain at least one item from this seller's products
    const sellerProductIds = await Product.find({ seller: req.user._id }).distinct("_id");
    const sellerProductIdsStr = sellerProductIds.map(String);

    const orders = await Order.find({
      "orderItems.product": { $in: sellerProductIds },
      orderStatus: { $nin: ["Cancelled"] },
    })
      .select("orderItems totalPrice paymentStatus orderStatus isCommissionSettled createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    let grossSales = 0;
    let totalUnitsSold = 0;
    let totalCommissionDebited = 0;
    let totalSellerNetEarning = 0;
    const productSales = {};
    const itemizedSales = [];

    for (const order of orders) {
      for (const item of order.orderItems) {
        const pid = item.product?.toString();
        if (!sellerProductIdsStr.includes(pid)) continue;

        const gross = item.grossItemTotal || (item.price * item.quantity);
        const commission = item.commissionDebited || 0;
        const net = item.sellerNetEarning || (gross - commission);

        if (order.paymentStatus === "Paid") {
          grossSales += gross;
          totalCommissionDebited += commission;
          totalSellerNetEarning += net;
        }

        totalUnitsSold += item.quantity;

        if (!productSales[pid]) {
          productSales[pid] = { name: item.name, image: item.image, units: 0, revenue: 0 };
        }
        productSales[pid].units += item.quantity;
        productSales[pid].revenue += order.paymentStatus === "Paid" ? gross : 0;

        itemizedSales.push({
          orderId: order._id,
          productName: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          grossItemTotal: gross,
          commissionRateApplied: item.commissionRateApplied || seller?.commissionAgreement?.agreedRate || 10,
          commissionDebited: commission,
          sellerNetEarning: net,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          isCommissionSettled: !!order.isCommissionSettled,
          createdAt: order.createdAt,
        });
      }
    }

    const agreedRate = seller?.commissionAgreement?.agreedRate ?? 10;
    const commissionType = seller?.commissionAgreement?.commissionType || "percentage";
    const availableCredits = Number(seller?.sellerCredits ?? totalSellerNetEarning ?? 0);
    const totalDebited = Number(seller?.totalCommissionDebited ?? totalCommissionDebited ?? 0);

    res.status(200).json({
      success: true,
      summary: {
        agreedRate,
        commissionType,
        grossSales: Number(grossSales ?? 0),
        totalRevenue: Number(grossSales ?? 0),
        totalUnitsSold: Number(totalUnitsSold ?? 0),
        totalOrders: Number(orders?.length ?? 0),
        totalCommissionDebited: totalDebited,
        sellerCredits: availableCredits,
        pendingSellerCredits: Number(seller?.pendingSellerCredits ?? 0),
        payoutAccount: seller?.payoutAccount || {},
      },
      topProducts: (Object.values(productSales) || []).sort((a, b) => b.units - a.units).slice(0, 10),
      itemizedSales: itemizedSales || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SELLER DASHBOARD STATS  –  GET /api/seller/dashboard, /api/seller/stats
// ============================================================
export const sellerGetDashboardStats = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);
    const sellerId = req.user._id;

    // Product counts
    const [totalProducts, approvedProducts, pendingProducts, rejectedProducts] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, approvalStatus: "approved" }),
      Product.countDocuments({ seller: sellerId, approvalStatus: "pending" }),
      Product.countDocuments({ seller: sellerId, approvalStatus: "rejected" }),
    ]);

    // Product IDs
    const sellerProductIds = await Product.find({ seller: sellerId }).distinct("_id");
    const sellerProductIdsStr = sellerProductIds.map(String);

    const orders = await Order.find({
      "orderItems.product": { $in: sellerProductIds },
      orderStatus: { $nin: ["Cancelled"] },
    })
      .select("orderItems totalPrice paymentStatus orderStatus isCommissionSettled createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    let grossSales = 0;
    let totalUnitsSold = 0;
    let totalCommissionDebited = 0;
    let totalSellerNetEarning = 0;
    const itemizedSales = [];

    for (const order of orders) {
      for (const item of order.orderItems) {
        const pid = item.product?.toString();
        if (!sellerProductIdsStr.includes(pid)) continue;

        const gross = item.grossItemTotal || (item.price * item.quantity);
        const commission = item.commissionDebited || 0;
        const net = item.sellerNetEarning || (gross - commission);

        if (order.paymentStatus === "Paid") {
          grossSales += gross;
          totalCommissionDebited += commission;
          totalSellerNetEarning += net;
        }

        totalUnitsSold += item.quantity;

        itemizedSales.push({
          orderId: order._id,
          productName: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          grossItemTotal: gross,
          commissionRateApplied: item.commissionRateApplied || seller?.commissionAgreement?.agreedRate || 10,
          commissionDebited: commission,
          sellerNetEarning: net,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          isCommissionSettled: !!order.isCommissionSettled,
          createdAt: order.createdAt,
        });
      }
    }

    const agreedRate = seller?.commissionAgreement?.agreedRate ?? 10;
    const commissionType = seller?.commissionAgreement?.commissionType || "percentage";
    const availableNetCredits = Number(seller?.sellerCredits ?? totalSellerNetEarning ?? 0);
    const debitedCommission = Number(seller?.totalCommissionDebited ?? totalCommissionDebited ?? 0);
    const pendingCredits = Number(seller?.pendingSellerCredits ?? 0);

    res.status(200).json({
      success: true,
      stats: {
        storeName: seller?.storeName || seller?.fullName || "My Store",
        role: seller?.role || "seller",
        kycStatus: seller?.kycStatus || "approved",
        commissionAgreement: {
          agreedRate,
          commissionType,
        },
        kpis: {
          grossSales: Number(grossSales ?? 0),
          totalCommissionDebited: debitedCommission,
          sellerCredits: availableNetCredits,
          pendingSellerCredits: pendingCredits,
          totalProducts: totalProducts ?? 0,
          approvedProducts: approvedProducts ?? 0,
          pendingProducts: pendingProducts ?? 0,
          rejectedProducts: rejectedProducts ?? 0,
          totalUnitsSold: totalUnitsSold ?? 0,
          totalOrders: orders.length ?? 0,
        },
        payoutAccount: seller?.payoutAccount || {},
      },
      recentSales: itemizedSales.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// REQUEST PAYOUT  –  POST /api/seller/payout-request
// ============================================================
export const sellerRequestPayout = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountHolder, telebirrPhone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid payout amount (ETB)." });
    }
    const currentCredits = Number(user.sellerCredits || 0);
    if (currentCredits < reqAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available net credits: ETB ${currentCredits.toFixed(2)}`,
      });
    }

    // Save payout details if provided
    if (bankName || accountNumber || accountHolder || telebirrPhone) {
      user.payoutAccount = user.payoutAccount || {};
      if (bankName) user.payoutAccount.bankName = bankName.trim();
      if (accountNumber) user.payoutAccount.accountNumber = accountNumber.trim();
      if (accountHolder) user.payoutAccount.accountHolder = accountHolder.trim();
      if (telebirrPhone) user.payoutAccount.telebirrPhone = telebirrPhone.trim();
    }

    const effectiveAccount = {
      bankName: bankName?.trim() || user.payoutAccount?.bankName || "",
      accountNumber: accountNumber?.trim() || user.payoutAccount?.accountNumber || "",
      accountHolder: accountHolder?.trim() || user.payoutAccount?.accountHolder || user.fullName,
      telebirrPhone: telebirrPhone?.trim() || user.payoutAccount?.telebirrPhone || "",
    };

    user.sellerCredits = Math.max(0, currentCredits - reqAmount);
    user.pendingSellerCredits = Number(user.pendingSellerCredits || 0) + reqAmount;
    await user.save();

    // Create persistent Payout record for Finance approval
    const payout = await Payout.create({
      seller: user._id,
      amount: reqAmount,
      accountDetails: effectiveAccount,
      status: "Pending",
    });

    // Notify Finance
    try {
      await Notification.create({
        targetRole: "finance",
        type: "payout_requested",
        title: "New Seller Payout Request 💸",
        message: `Seller "${user.storeName || user.fullName}" requested payout of ETB ${reqAmount.toLocaleString()} to ${effectiveAccount.bankName || "Telebirr"}.`,
        link: "/finance/dashboard",
      });
    } catch (notifErr) {
      console.error("[sellerRequestPayout] Notification error:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Payout request for ETB ${reqAmount.toFixed(2)} submitted successfully! The finance team will process your transfer.`,
      payout,
      sellerCredits: user.sellerCredits,
      pendingSellerCredits: user.pendingSellerCredits,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET SELLER PAYOUT HISTORY  –  GET /api/seller/payout-requests
// ============================================================
export const sellerGetPayoutHistory = async (req, res) => {
  try {
    const payouts = await Payout.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SUBMIT / UPDATE KYC  –  POST /api/seller/kyc (or /api/auth/become-seller)
// Body: multipart/form-data or JSON:
//  - storeName (string)
//  - nationalIdNumber (string)
//  - idDocumentImage (file or URL string)
//  - legacy support: idFront, idBack, selfie
// ============================================================
export const sellerSubmitKYC = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.kycStatus === "verified" || user.kycStatus === "approved") {
      return res.status(400).json({ success: false, message: "KYC already verified and approved." });
    }

    const storeName = req.body.storeName?.trim() || user.storeName;
    const nationalIdNumber = req.body.nationalIdNumber?.trim() || user.nationalIdNumber;

    let idFront = "";
    let idBack = "";

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          const fn = file.fieldname;
          const p = file.path || file.filename || "";
          const filePath = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
          if (["idFront", "idFrontImage", "idDocumentImage", "front"].includes(fn)) {
            if (!idFront) idFront = filePath;
          } else if (["idBack", "idBackImage", "back"].includes(fn)) {
            if (!idBack) idBack = filePath;
          }
        }
        // Fallback: if not matched by fieldname, use position order
        if (!idFront && req.files[0]) {
          const p = req.files[0].path || req.files[0].filename || "";
          idFront = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
        }
        if (!idBack && req.files[1]) {
          const p = req.files[1].path || req.files[1].filename || "";
          idBack = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
        }
      } else if (typeof req.files === "object") {
        const front =
          req.files.idFront?.[0] ||
          req.files.idFrontImage?.[0] ||
          req.files.idDocumentImage?.[0] ||
          req.files.front?.[0];
        const back =
          req.files.idBack?.[0] ||
          req.files.idBackImage?.[0] ||
          req.files.back?.[0];

        if (front) {
          const p = front.path || front.filename || "";
          idFront = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
        }
        if (back) {
          const p = back.path || back.filename || "";
          idBack = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
        }
      }
    } else if (req.file) {
      const p = req.file.path || req.file.filename || "";
      idFront = p.startsWith("http") || p.startsWith("/uploads") ? p : `/uploads/${p}`;
    }

    if (!idFront) {
      idFront =
        req.body.idFrontImage ||
        req.body.idFront ||
        req.body.idDocumentImage ||
        user.idFrontImage ||
        user.kycDocs?.idFront ||
        user.idDocumentImage ||
        "";
    }

    if (!idBack) {
      idBack =
        req.body.idBackImage ||
        req.body.idBack ||
        user.idBackImage ||
        user.kycDocs?.idBack ||
        "";
    }

    if (!storeName) {
      return res.status(400).json({ success: false, message: "Business / Store Name is required." });
    }
    if (!nationalIdNumber) {
      return res.status(400).json({ success: false, message: "National ID / Trade License Number is required." });
    }
    if (!idFront) {
      return res.status(400).json({ success: false, message: "National ID / Passport (Front) is required." });
    }

    user.storeName        = storeName;
    user.nationalIdNumber = nationalIdNumber;
    user.idFrontImage     = idFront;
    user.idBackImage      = idBack;
    user.idDocumentImage  = idFront; // backward compatibility

    user.kycDocs = user.kycDocs || {};
    user.kycDocs.idFront = idFront;
    user.kycDocs.idBack  = idBack;

    user.kycStatus          = "pending";
    user.kycRejectionReason = "";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Seller application submitted successfully. Awaiting Owner review.",
      kycStatus: user.kycStatus,
      user: {
        _id:              user._id,
        fullName:         user.fullName,
        email:            user.email,
        role:             user.role,
        storeName:        user.storeName,
        nationalIdNumber: user.nationalIdNumber,
        idFrontImage:     user.idFrontImage,
        idBackImage:      user.idBackImage,
        idDocumentImage:  user.idDocumentImage,
        kycDocs:          user.kycDocs,
        kycStatus:        user.kycStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// GET OWN KYC & FINANCIAL STATUS  –  GET /api/seller/kyc
// ============================================================
export const sellerGetKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "kycStatus storeName nationalIdNumber idDocumentImage idFrontImage idBackImage kycDocs kycRejectionReason kycReviewedAt commissionAgreement sellerCredits pendingSellerCredits totalCommissionDebited payoutAccount"
    );
    res.status(200).json({ success: true, kyc: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// UPDATE PAYOUT ACCOUNT  –  PUT /api/seller/payout-account
// Body: { bankName, accountHolder, accountNumber, telebirrPhone }
// ============================================================
export const sellerUpdatePayoutAccount = async (req, res) => {
  try {
    const { bankName, accountHolder, accountNumber, telebirrPhone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.payoutAccount = {
      bankName:      bankName      !== undefined ? bankName.trim()      : user.payoutAccount?.bankName || "",
      accountHolder: accountHolder !== undefined ? accountHolder.trim() : user.payoutAccount?.accountHolder || "",
      accountNumber: accountNumber !== undefined ? accountNumber.trim() : user.payoutAccount?.accountNumber || "",
      telebirrPhone: telebirrPhone !== undefined ? telebirrPhone.trim() : user.payoutAccount?.telebirrPhone || "",
    };

    await user.save();
    res.status(200).json({
      success: true,
      message: "Payout account details updated successfully.",
      payoutAccount: user.payoutAccount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// SELLER — View reviews on own products (read-only)
// GET /api/seller/reviews
// Query: page, limit, productId, rating
// ============================================================
export const sellerGetReviews = async (req, res) => {
  try {
    const page    = Math.max(Number(req.query.page)  || 1, 1);
    const limit   = Math.min(Math.max(Number(req.query.limit) || 15, 1), 100);
    const { productId, rating } = req.query;

    // Only reviews for products owned by this seller
    const sellerProductIds = await Product.find({ seller: req.user._id }).distinct("_id");

    if (!sellerProductIds.length) {
      return res.status(200).json({
        success: true, total: 0, page, pages: 0, reviews: [],
        stats: { avgRating: 0, totalReviews: 0, breakdown: [] },
      });
    }

    const match = { product: { $in: sellerProductIds } };
    if (productId) match.product = productId;
    if (rating)    match.rating  = Number(rating);

    const [total, reviews, breakdown] = await Promise.all([
      Review.countDocuments(match),
      Review.find(match)
        .populate("user",    "fullName")
        .populate("product", "name image")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.aggregate([
        { $match: match },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const breakdownMap = Object.fromEntries(breakdown.map(b => [b._id, b.count]));
    const totalVotes   = breakdown.reduce((s, b) => s + b.count, 0);
    const weightedSum  = breakdown.reduce((s, b) => s + b._id * b.count, 0);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews,
      stats: {
        totalReviews: total,
        avgRating:    totalVotes > 0 ? Number((weightedSum / totalVotes).toFixed(2)) : 0,
        breakdown:    [5,4,3,2,1].map(star => ({ star, count: breakdownMap[star] || 0 })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
