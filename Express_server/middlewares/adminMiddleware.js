import * as userRepo from '../utils/userQueryData.js';

export default async function adminMiddleware(req, res, next) {
  try {
    // Fix the missing userUuid variable declaration
    const userUuid = req.user?.uuid || req.user?.userUUID;
    
    if (!userUuid) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Get user with role information
    const user = await userRepo.getUserByUUID(userUuid);
    
    // Check for admin role
    if (!user || user.role !== 'admin') {
      console.log(`Access denied: User ${userUuid} attempted to access admin route`);
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }
    
    // User is admin, proceed
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: "Server error" });
  }
}