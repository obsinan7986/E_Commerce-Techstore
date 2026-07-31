import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Helper function
const calculateCartTotals = (cart) => {
  let totalItems = 0;
  let totalPrice = 0;

  cart.items.forEach((item) => {
    totalItems += item.quantity;

    if (item.product && item.product.price) {
      totalPrice += item.product.price * item.quantity;
    }
  });

  return { totalItems, totalPrice };
};

// ===============================
// Add Product To Cart
// ===============================
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    await cart.save();

    await cart.populate("items.product");

    const { totalItems, totalPrice } = calculateCartTotals(cart);

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      cart,
      totalItems,
      totalPrice,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Get Logged-in User Cart
// @route   GET /api/cart
// @access  Private

export const getCart = async (req, res) => {
  try {

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
        },
      });
    }

    // Remove invalid products
    cart.items = cart.items.filter(item => item.product);

    await cart.save();

    // Calculate total
    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    res.status(200).json({
      success: true,
      cart,
      totalPrice,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===============================
// Update Quantity
// ===============================
export const updateCartItem = async (req, res) => {
  try {

    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    item.quantity = quantity;

    await cart.save();

    await cart.populate("items.product");

    const { totalItems, totalPrice } = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
      totalItems,
      totalPrice,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===============================
// Remove Product
// ===============================
export const removeCartItem = async (req, res) => {
  try {

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    await cart.populate("items.product");

    const { totalItems, totalPrice } = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
      totalItems,
      totalPrice,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===============================
// Clear Cart
// ===============================
export const clearCart = async (req, res) => {
  try {

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
      totalItems: 0,
      totalPrice: 0,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};