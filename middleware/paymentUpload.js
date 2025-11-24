const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = path.extname(file.originalname).toLowerCase();

        if (fileTypes.test(extname) && file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG/PNG images are allowed!"));
        }
    },
});

module.exports = upload;
