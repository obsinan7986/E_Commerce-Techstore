import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    protect,
    admin,
    upload.single("image"),
    (req, res) => {

        res.status(200).json({

            message: "Image uploaded successfully",

            image: `/uploads/${req.file.filename}`

        });

    }
);

export default router;