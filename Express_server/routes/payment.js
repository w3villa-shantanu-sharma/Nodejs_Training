// routes/payment.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authenticate = require('../middlewares/authenciate');
// Payment routes - REMOVED duplicate "/payment" prefix
router.post('/create-order', authenticate, userController.createOrder);
router.post('/verify', authenticate, userController.verifyPayment);
// router.post('/payment/verify', authenticate, userController.verifyPayment);
module.exports = router;
