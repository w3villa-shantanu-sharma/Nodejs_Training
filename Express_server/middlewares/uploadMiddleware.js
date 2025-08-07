import multer from 'multer';

const storage = multer.memoryStorage(); // We'll use buffer to upload to Storj
const upload = multer({ storage });

export default upload;
