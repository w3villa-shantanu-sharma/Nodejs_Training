import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { secret } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("No token provided in request");
      return res.status(401).json({ 
        message: "No token provided",
        code: "NO_TOKEN" 
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const dbToken = await userRepo.getTokenByHash(tokenHash);
    
    if (!dbToken || dbToken.is_revoked || new Date() > new Date(dbToken.expires_at)) {
      console.log("Invalid or expired token");
      return res.status(401).json({ 
        message: "Invalid or expired token",
        code: dbToken ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
      });
    }
    
    const decoded = jwt.verify(token, secret);
    console.log("Token verified successfully for user:", decoded.email);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ 
      message: "Invalid token",
      code: "INVALID_TOKEN" 
    });
  }
};

export default authenticate;