// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const authMiddleware = require('../middlewares/authenticate');

// Routes
router.post('/create-order', authMiddleware, userControllers.createOrder);
router.post('/verify', authMiddleware, userControllers.verifyPayment);

module.exports = router;
