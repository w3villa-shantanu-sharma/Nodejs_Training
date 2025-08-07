import express from 'express';
import authenticate from '../middlewares/authenciate.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Admin middleware to check if user has admin role
const adminCheck = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.log('Admin access denied for:', req.user?.email || 'Unknown user');
    return res.status(403).json({
      message: "Admin access required",
      code: "ADMIN_REQUIRED"
    });
  }
  next();
};

// Apply authentication middleware to all admin routes
router.use(authenticate);
router.use(adminCheck);

// Admin dashboard statistics
router.get('/stats', adminController.getStats);

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/:uuid', adminController.getUserDetails);
router.put('/users/:uuid', adminController.updateUser);
router.delete('/users/:uuid', adminController.deleteUser);

export default router;