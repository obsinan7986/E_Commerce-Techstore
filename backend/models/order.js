import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const shippingSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    city: String,
    subCity: String,
    address: String,
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [orderItemSchema],

    shippingAddress: shippingSchema,

    paymentMethod: {
      type: String,
      enum: [
        "Chapa",
        "Cash On Delivery",
      ],
      default: "Cash On Delivery",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    itemsPrice: {
      type: Number,
      required: true,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    taxPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    paymentResult: {
      transactionId: {
        type: String,
        default: "",
      },

      txRef: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        default: "",
      },

      method: {
        type: String,
        default: "",
      },

      amount: {
        type: Number,
        default: 0,
      },

      currency: {
        type: String,
        default: "ETB",
      },
    },

    paidAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;