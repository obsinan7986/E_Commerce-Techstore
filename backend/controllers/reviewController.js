import Review  from "../models/Review.js";
import Product from "../models/Product.js";
import Order   from "../models/Order.js";
import createAdminNotification from "../utils/createAdminNotification.js";

/* ── helper: recalculate product rating ─────────────────── */
const recalcProduct = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const product = await Product.findById(productId);
  if (!product) return;
  product.numReviews = reviews.length;
  product.rating     = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;
  await product.save();
};

// ─────────────────────────────────────────────────────────
// GET /api/reviews/:productId
// Public — paginated list + rating breakdown
// ─────────────────────────────────────────────────────────
export const getProductReviews = async (req, res) => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const sort  = req.query.sort === "highest" ? { rating: -1 }
                : req.query.sort === "lowest"  ? { rating:  1 }
                : { createdAt: -1 };

    const filter = { product: req.params.productId };

    const [total, reviews, breakdown] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .populate("user", "fullName")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Review.aggregate([
        { $match: { product: new (await import("mongoose")).default.Types.ObjectId(req.params.productId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    // Build breakdown [{ star: 5, count: N }, ...]
    const breakdownMap = Object.fromEntries(breakdown.map((b) => [b._id, b.count]));
    const ratingBreakdown = [5,4,3,2,1].map((star) => ({
      star,
      count: breakdownMap[star] || 0,
    }));

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      ratingBreakdown,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/reviews
// Protected — only users who purchased the product
// ─────────────────────────────────────────────────────────
export const createReview = async (req, res) => {
  try {
    const { productId, rating, title = "", comment } = req.body;

    if (!productId || !rating || !comment?.trim()) {
      return res.status(400).json({ success: false, message: "Product, rating and comment are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    if (comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Comment must be at least 5 characters." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this product." });

    // Check if user purchased this product (any non-cancelled order containing it)
    const purchaseOrder = await Order.findOne({
      user:         req.user._id,
      orderStatus:  { $ne: "Cancelled" },
      "orderItems.product": productId,
    });

    const review = await Review.create({
      product:          productId,
      user:             req.user._id,
      rating:           Number(rating),
      title:            title.trim().slice(0, 120),
      comment:          comment.trim(),
      verifiedPurchase: !!purchaseOrder,
    });

    await recalcProduct(productId);
    const populated = await review.populate("user", "fullName");

    // Notify admins of new review (fire-and-forget)
    createAdminNotification({
      type:    "admin_new_review",
      title:   "New Product Review",
      message: `${review.user?.fullName || "A customer"} left a ${review.rating}★ review on "${product.name}".`,
      link:    `/product/${productId}`,
    }).catch(() => {});

    return res.status(201).json({ success: true, message: "Review added.", review: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PUT /api/reviews/:id
// Protected — only the review owner
// ─────────────────────────────────────────────────────────
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const { rating, title, comment } = req.body;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
      review.rating = Number(rating);
    }
    if (title   !== undefined) review.title   = String(title).trim().slice(0, 120);
    if (comment !== undefined) {
      if (String(comment).trim().length < 5) return res.status(400).json({ success: false, message: "Comment must be at least 5 characters." });
      review.comment = String(comment).trim();
    }

    await review.save();
    await recalcProduct(review.product);

    const populated = await review.populate("user", "fullName");
    return res.status(200).json({ success: true, message: "Review updated.", review: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/reviews/:id
// Protected — owner OR admin
// ─────────────────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalcProduct(productId);

    return res.status(200).json({ success: true, message: "Review deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/reviews/check/:productId
// Protected — can the logged-in user review this product?
// Returns: { canReview, hasPurchased, existingReview }
// ─────────────────────────────────────────────────────────
export const checkCanReview = async (req, res) => {
  try {
    const { productId } = req.params;

    const [existingReview, purchaseOrder] = await Promise.all([
      Review.findOne({ product: productId, user: req.user._id }),
      Order.findOne({
        user:                  req.user._id,
        orderStatus:           { $ne: "Cancelled" },
        "orderItems.product":  productId,
      }),
    ]);

    return res.status(200).json({
      success:       true,
      hasPurchased:  !!purchaseOrder,
      canReview:     !!purchaseOrder && !existingReview,
      existingReview: existingReview || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
