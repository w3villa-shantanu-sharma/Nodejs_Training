import authenticate from './authenciate.js';

const adminAuth = async (req, res, next) => {
  try {
    // First ensure the user is authenticated
    authenticate(req, res, () => {
      // Now check if the user has admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          message: "Admin access required",
          code: "ADMIN_REQUIRED"
        });
      }
      
      // Admin user confirmed, proceed
      next();
    });
  } catch (err) {
    console.error('Admin auth middleware error:', err);
    return res.status(500).json({
      message: "Server error",
      code: "SERVER_ERROR"
    });
  }
};

export default adminAuth;