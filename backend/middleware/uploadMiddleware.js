import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, "uploads/");

    },

    filename(req, file, cb) {

        cb(

            null,

            `${Date.now()}${path.extname(file.originalname)}`

        );

    },

});

// Allow images and PDFs (for identity / trade license documents)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image") || file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only image files and PDFs are allowed"), false);
    }
};

const upload = multer({

    storage,

    fileFilter,

});

export default upload;