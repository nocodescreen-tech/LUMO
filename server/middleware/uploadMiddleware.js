const multer = require('multer');
const path = require('path');

// On garde multer uniquement en mémoire : l'image sera directement envoyée à Cloudinary
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Uniquement les formats d\'images sont acceptés (jpg, jpeg, png, webp)'));
    }
};

const uploadAvatar = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

module.exports = uploadAvatar;
