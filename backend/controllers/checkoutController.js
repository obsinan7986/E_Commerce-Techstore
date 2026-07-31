import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

export const checkout = async (req, res) => {
  try {

    const {
      fullName,
      phone,
      city,
      subCity,
      address,
      paymentMethod,
    } = req.body;

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }
    // Validate every product before creating the order
for (const item of cart.items) {

  if (!item.product) {
    return res.status(404).json({
      success: false,
      message: "A product in the cart no longer exists.",
    });
  }

  if (!item.product.image) {
    return res.status(400).json({
      success: false,
      message: `Product "${item.product.name}" has no image. Please update the product first.`,
    });
  }

}
const orderItems = cart.items.map((item) => ({
  product: item.product._id,
  name: item.product.name,
  image: item.product.image,
  quantity: item.quantity,
  price: item.product.price,
}));

    const itemsPrice = orderItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const shippingPrice = 100;

    const taxPrice = itemsPrice * 0.15;

    const totalPrice =
      itemsPrice +
      shippingPrice +
      taxPrice;

    const order = await Order.create({

      user: req.user._id,

      orderItems,

      shippingAddress: {
        fullName,
        phone,
        city,
        subCity,
        address,
      },

      paymentMethod,

      itemsPrice,

      shippingPrice,

      taxPrice,

      totalPrice,

    });

    res.status(201).json({
      success: true,
      order,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};