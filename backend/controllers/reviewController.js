import Review from "../models/Review.js";
import Product from "../models/Product.js";

// ======================================
// Create Review
// ======================================
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide product, rating and comment.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check duplicate review
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    // Recalculate rating
    const reviews = await Review.find({
      product: productId,
    });

    product.numReviews = reviews.length;

    product.rating =
      reviews.reduce((acc, item) => acc + item.rating, 0) /
      reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      review,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Update Review
// ======================================

export const updateReview = async (req, res) => {
  try {

    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Only review owner can update
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    // Update product rating
    const reviews = await Review.find({
      product: review.product,
    });

    const product = await Product.findById(review.product);

    product.numReviews = reviews.length;

    product.rating =
      reviews.reduce((acc, item) => acc + item.rating, 0) /
      reviews.length;

    await product.save();

    res.json({
      success: true,
      message: "Review updated successfully.",
      review,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ======================================
// Delete Review
// ======================================

export const deleteReview = async (req, res) => {
  try {

    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Only review owner can delete
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    const productId = review.product;

    await review.deleteOne();

    // Recalculate rating
    const reviews = await Review.find({
      product: productId,
    });

    const product = await Product.findById(productId);

    product.numReviews = reviews.length;

    product.rating =
      reviews.length > 0
        ? reviews.reduce((acc, item) => acc + item.rating, 0) /
          reviews.length
        : 0;

    await product.save();

    res.json({
      success: true,
      message: "Review deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ======================================
// Get Product Reviews
// ======================================

export const getProductReviews = async (req, res) => {

  try {

    const reviews = await Review.find({
      product: req.params.productId,
    }).populate("user", "fullName");

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};