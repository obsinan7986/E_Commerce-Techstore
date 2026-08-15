import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      // Not required for Google-auth users
      minlength: 6,
      default: null,
    },

    phone: {
      type: String,
      default: "",
    },

    googleId: {
      type: String,
      default: null,
      index: true,
      sparse: true,   // allow multiple null values (non-Google users)
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    // Set to true after the user's first completed order discount is used
    firstOrderDiscountUsed: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.role === "admin") {
    this.isAdmin = true;
  } else if (this.role === "customer") {
    this.isAdmin = false;
  }
});

const User = mongoose.model("User", userSchema);

export default User;