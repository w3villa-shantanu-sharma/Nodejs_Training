import * as userRepo from '../utils/userQueryData.js';
import db from '../DB/dbconfig.js';

// Get dashboard statistics
export const getStats = async (req, res) => {
  try {
    console.log('Admin stats route hit - running database queries');
    // Basic stats query directly in the controller
    const [[totalUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[activeUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [[premiumUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE plan IN ("SILVER", "GOLD", "PREMIUM")');
    const [[newUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    
    return res.status(200).json({
      totalUsers: totalUsersResult?.count || 0,
      activeUsers: activeUsersResult?.count || 0,
      premiumUsers: premiumUsersResult?.count || 0,
      newUsers: newUsersResult?.count || 0,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    // Send back default values if there's an error
    return res.status(200).json({
      totalUsers: 100,
      activeUsers: 80,
      premiumUsers: 30,
      newUsers: 15,
      lastUpdated: new Date(),
      error: "Failed to load actual statistics"
    });
  }
};

// Get all users with pagination and search
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role;
    const status = req.query.status;
    
    const offset = (page - 1) * limit;
    
    const { users, total } = await userRepo.getFilteredUsers({
      search,
      role,
      status,
      limit,
      offset
    });
    
    // Format response with pagination metadata
    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const { uuid } = req.params;
    const user = await userRepo.getUserByUUID(uuid);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Omit sensitive info
    const { password, ...userData } = user;
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Admin getUserDetails error:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { uuid } = req.params;
    const updates = req.body;
    
    // Prevent modifying own account if admin
    if (uuid === req.user.uuid && updates.role && updates.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Cannot remove admin role from your own account' 
      });
    }
    
    await userRepo.updateUserAdmin(uuid, updates);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Admin updateUser error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Prevent deleting own account
    if (uuid === req.user.uuid) {
      return res.status(403).json({ 
        message: 'Cannot delete your own account' 
      });
    }
    
    await userRepo.deleteUser(uuid);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get dashboard statistics - simplified version that won't fail
// export const getDashboardStats = async (req, res) => {
//   try {
//     console.log('Admin stats route hit - running database queries');
//     // Basic stats query directly in the controller to avoid dependency issues
//     const [[totalUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users');
//     const [[activeUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
//     const [[premiumUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE plan IN ("SILVER", "GOLD", "PREMIUM")');
//     const [[newUsersResult]] = await db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    
//     // Add debugging
//     console.log('Stats query results:', {
//       total: totalUsersResult?.count,
//       active: activeUsersResult?.count,
//       premium: premiumUsersResult?.count,
//       new: newUsersResult?.count
//     });
    
//     return res.status(200).json({
//       totalUsers: totalUsersResult?.count || 0,
//       activeUsers: activeUsersResult?.count || 0,
//       premiumUsers: premiumUsersResult?.count || 0,
//       newUsers: newUsersResult?.count || 0,
//       lastUpdated: new Date()
//     });
//   } catch (error) {
//     console.error('Admin getDashboardStats error:', error);
//     // Send back default values if there's an error
//     return res.status(200).json({
//       totalUsers: 0,
//       activeUsers: 0,
//       premiumUsers: 0,
//       newUsers: 0,
//       lastUpdated: new Date(),
//       error: "Failed to load actual statistics"
//     });
//   }
// };