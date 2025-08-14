import jwt from 'jsonwebtoken';
import { secret } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';
import crypto from 'crypto';

export default async (req, res, next) => {
  try {
    // FIX: Better token extraction
    const authHeader = req.headers.authorization || '';
    const token = req.cookies?.token || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    // Debug logs to identify issues
    console.log(`[Auth] Token found: ${!!token}`);
    
    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN"
      });
    }
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      console.log(`[Auth] Token verified for user: ${decoded.email}`);
    } catch (jwtError) {
      console.error(`[Auth] JWT Error: ${jwtError.message}`);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Token expired, please login again",
          code: "TOKEN_EXPIRED"
        });
      }
      return res.status(401).json({
        message: "Invalid token",
        code: "INVALID_TOKEN"
      });
    }
    
    // FIX: Ensure we have the UUID from the token
    const userUUID = decoded.uuid || decoded.userUUID;
    if (!userUUID) {
      console.error("[Auth] No UUID found in token");
      return res.status(401).json({
        message: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT"
      });
    }
    
    // Get user data - this was failing
    try {
      const user = await userRepo.getUserByUUID(userUUID);
      
      if (!user) {
        console.error(`[Auth] User not found with UUID: ${userUUID}`);
        return res.status(401).json({ 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }
      
      // Add user to request object
      req.user = {
        ...decoded,
        uuid: userUUID, // Ensure this property exists
        role: user.role || 'user',
        isAdmin: user.role === 'admin'
      };
      
      console.log(`[Auth] User authenticated: ${user.email}, role: ${user.role}`);
      next();
    } catch (dbError) {
      console.error("[Auth] Database error:", dbError);
      return res.status(500).json({
        message: "Server error during authentication",
        code: "DB_ERROR"
      });
    }
  } catch (err) {
    console.error('[Auth] General error:', err);
    return res.status(500).json({
      message: "Authentication failed",
      code: "AUTH_ERROR"
    });
  }
};