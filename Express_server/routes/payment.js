// routes/payment.js
import express from 'express';
import authenticate from '../middlewares/authenciate.js';
import * as userController from '../controllers/userControllers.js';

const router = express.Router();

// Payment routes
router.post('/create-order', authenticate, userController.createOrder);
router.post('/verify', authenticate, userController.verifyPayment);

export default router;
