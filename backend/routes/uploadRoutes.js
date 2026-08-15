import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post(
    "/",
    protect,
    admin,
    upload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            image: `/uploads/${req.file.filename}`,
        });
    }
);

export default router;