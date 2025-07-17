// middleware/uploadMiddleware.js
const multer = require('multer');
const storage = multer.memoryStorage(); // We'll use buffer to upload to Storj
const upload = multer({ storage });

module.exports = upload;
