import jwt from 'jsonwebtoken';
import { secret } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';
import crypto from 'crypto';
import Messages from '../constants/messages.js';
import StatusCodes from '../constants/statusCode.js';

export default async (req, res, next) => {
  try {
    // Better token extraction
    const authHeader = req.headers.authorization || '';
    const token = req.cookies?.token || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

    // Debug logs to identify issues
    console.log(`[Auth] Token found: ${!!token}`);
    
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: Messages.ERROR.AUTHENTICATION_REQUIRED || "Authentication required",
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
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: Messages.ERROR.TOKEN_EXPIRED || "Token expired, please login again",
          code: "TOKEN_EXPIRED"
        });
      }
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: Messages.ERROR.INVALID_OR_EXPIRED_TOKEN,
        code: "INVALID_TOKEN"
      });
    }
    
    // Ensure we have the UUID from the token
    const userUUID = decoded.uuid || decoded.userUUID;
    if (!userUUID) {
      console.error("[Auth] No UUID found in token");
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: Messages.ERROR.INVALID_TOKEN_FORMAT || "Invalid token format",
        code: "INVALID_TOKEN_FORMAT"
      });
    }
    
    // Get user data
    try {
      const user = await userRepo.getUserByUUID(userUUID);
      
      if (!user) {
        console.error(`[Auth] User not found with UUID: ${userUUID}`);
        return res.status(StatusCodes.UNAUTHORIZED).json({ 
          message: Messages.ERROR.USER_NOT_FOUND,
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
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: Messages.ERROR.SERVER_ERROR,
        code: "DB_ERROR"
      });
    }
  } catch (err) {
    console.error('[Auth] General error:', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: Messages.ERROR.AUTHENTICATION_FAILED || "Authentication failed",
      code: "AUTH_ERROR"
    });
  }
};