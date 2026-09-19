const multer = require('multer');

// Use memory storage - we'll upload to Cloudinary manually
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  allowedTypes.includes(file.mimetype) 
    ? cb(null, true) 
    : cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.'), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;