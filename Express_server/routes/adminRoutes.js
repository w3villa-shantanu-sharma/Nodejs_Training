import express from 'express';
import authenticate from '../middlewares/authenciate.js';

const router = express.Router();

// Create a middleware for admin authentication
const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Admin access required",
        code: "ADMIN_REQUIRED"
      });
    }
    // User is admin, proceed to the next middleware
    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    return res.status(500).json({
      message: "Server error",
      code: "SERVER_ERROR"
    });
  }
};

// Apply authentication middleware to all admin routes
router.use(authenticate);
router.use(adminAuth);

// Admin routes with proper handlers
router.get('/stats', (req, res) => {
  try {
    // Mock stats for now - you can replace with actual DB queries
    const stats = {
      totalUsers: 150,
      activeUsers: 120,
      premiumUsers: 45,
      totalPodcasts: 78,
      revenue: {
        monthly: 2450,
        yearly: 28500
      },
      recentSignups: 12,
      userGrowth: 8.5
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// User management routes
router.get('/users', async (req, res) => {
  try {
    // You can implement this with your user repository
    // For now returning mock data
    const users = [
      { id: 1, name: 'User One', email: 'user1@example.com', role: 'user', plan: 'FREE' },
      { id: 2, name: 'User Two', email: 'user2@example.com', role: 'user', plan: 'PREMIUM' }
    ];
    
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    // Implement user lookup with your repository
    const user = { uuid, name: 'Test User', email: 'test@example.com' };
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

router.put('/users/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const updates = req.body;
    
    // Implement user update with your repository
    res.status(200).json({ 
      message: 'User updated successfully',
      user: { uuid, ...updates }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/users/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Implement user deletion with your repository
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;