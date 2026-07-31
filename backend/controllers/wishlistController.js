import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
export const addToWishlist = async (req, res) => {

  try {

    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        products: [],
      });
    }

    const exists = wishlist.products.some(
      id => id.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        message: "Product already exists in wishlist",
      });
    }

    wishlist.products.push(productId);

    await wishlist.save();

    res.status(201).json(wishlist);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};
export const getWishlist = async (req, res) => {

  try {

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    }).populate("products");

    if (!wishlist) {
      return res.status(200).json({
        products: [],
      });
    }

    res.status(200).json(wishlist);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};
export const removeFromWishlist = async (req, res) => {

  try {

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found",
      });
    }

    wishlist.products = wishlist.products.filter(
      product => product.toString() !== req.params.productId
    );

    await wishlist.save();

    res.status(200).json({
      message: "Product removed successfully",
      wishlist,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};