import jwt from 'jsonwebtoken';
import { secret } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';
import crypto from 'crypto';

export default async (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    const token = req.cookies?.token || 
                  req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN"
      });
    }
    
    // First verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      return res.status(401).json({
        message: "Invalid token",
        code: "INVALID_TOKEN"
      });
    }
    
    // Then verify the token exists in database and is not revoked
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const dbToken = await userRepo.getTokenByHash(tokenHash);
    
    if (!dbToken || dbToken.is_revoked || new Date() > new Date(dbToken.expires_at)) {
      return res.status(401).json({
        message: "Invalid or expired token",
        code: "INVALID_TOKEN"
      });
    }
    
    // Get full user data
    const user = await userRepo.getUserByUUID(decoded.uuid || decoded.userUUID);
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }
    
    // Add user to request object
    req.user = {
      ...decoded,
      role: user.role || 'user',
      isAdmin: user.role === 'admin',
      plan: user.plan || 'FREE'
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      message: "Authentication failed",
      code: "AUTH_ERROR"
    });
  }
};