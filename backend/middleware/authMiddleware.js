import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user without password
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};
export const admin = (req, res, next) => {

    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({
            message: "Admin access only",
        });
    }

};