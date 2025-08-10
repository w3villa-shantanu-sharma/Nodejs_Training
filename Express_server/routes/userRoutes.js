import express from 'express';
import checkNextAction from '../middlewares/checkNextAction.js';
import * as newAuthControllers from '../controllers/newAuthController.js';
import fixedWindowRateLimiter from '../middlewares/rateLimiter.js';
import authenticate from '../middlewares/authenciate.js';
import upload from '../middlewares/uploadMiddleware.js';
import * as userController from '../controllers/userControllers.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepo from '../utils/userQueryData.js'; // FIXED: Import from utils instead of repositories
import { secret } from '../config/jwt.js'; // ADDED: Import secret for JWT verification

const router = express.Router();

// Limit OTP send per email to 3 per 15 minutes
const otpLimiter = fixedWindowRateLimiter({
    // Make sure this returns just the email string, not an object
    keyGenerator: (req) => {
      // Get just the email string
      const email = req.body.email || 'unknown';
      return email;
    },
    maxRequests: 3,
    windowSizeInSeconds: 15 * 60,
    message: 'Too many OTP requests. Please wait 15 minutes.'
  });
  
  // Limit email verification resend per email to 3 per 15 minutes
  const resendEmailLimiter = fixedWindowRateLimiter({
    keyGenerator: (req) => req.body.email || 'unknown',
    maxRequests: 3,
    windowSizeInSeconds: 15 * 60,
    message: 'Too many verification emails sent. Try again later.'
  });
  
  // Limit registration attempts per IP to 10 per hour
  const registerLimiter = fixedWindowRateLimiter({
    keyGenerator: (req) => req.ip,
    maxRequests: 20,
    windowSizeInSeconds: 60 * 60,
    message: 'Too many registration attempts. Try again in an hour.'
  });
  

router.post('/register' ,registerLimiter,newAuthControllers.registerUser );
router.get('/verify-email/:token' , newAuthControllers.verifyEmail);

router.post('/resend-verification' ,resendEmailLimiter,newAuthControllers.resendVerificationEmail);
router.post('/login' ,newAuthControllers.loginUser);

router.post('/send-otp', otpLimiter,checkNextAction('MOBILE_OTP'), newAuthControllers.sendMobileOtp);

// Verify OTP
router.post('/verify-otp', checkNextAction('MOBILE_OTP'), newAuthControllers.verifyMobileOtp);
router.post('/complete-profile', authenticate, newAuthControllers.completeProfile);


router.post(
  '/profile/upload',
  authenticate,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

// routes/userRoutes.js
router.put(
  '/profile/address',
  authenticate,
  userController.updateAddress
);

router.get(
  '/profile/download',
  authenticate,
  userController.downloadProfile
);

// Add this route to serve images
router.get('/profile-image/:filename', userController.getProfileImage);

router.get('/me', authenticate, userController.getCurrentUser);
router.put('/edit-profile', authenticate, userController.updateProfile);

// Add these routes to your user routes

router.get(
  '/notifications',
  authenticate,
  userController.getUserNotifications
);

router.put(
  '/notifications/:notificationId/seen',
  authenticate,
  userController.markNotificationSeen
);

// Add logout routes
router.post('/logout', authenticate, newAuthControllers.logout);
router.post('/logout-all', authenticate, newAuthControllers.logoutAllDevices);

// Add this route for setting auth cookie
router.post('/set-auth-cookie', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  // Set the cookie with the same settings as your login route
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 1000 * 24, // 1 day
  });

  return res.status(200).json({ message: 'Cookie set successfully' });
});

// Add refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    
    // If no token provided, try to create a new one based on an existing session
    if (!token) {
      // For existing sessions without a token, we may return an error or try
      // session-based authentication depending on your implementation
      return res.status(401).json({ 
        message: "No token provided",
        code: "NO_TOKEN"
      });
    }
    
    // Validate token in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const dbToken = await userRepo.getTokenByHash(tokenHash);
    
    if (!dbToken || dbToken.is_revoked) {
      return res.status(401).json({ 
        message: "Invalid token",
        code: "INVALID_TOKEN"
      });
    }
    
    // Generate new token
    const decoded = jwt.decode(token);
    const newToken = await createAndStoreToken(
      decoded.uuid || decoded.userUUID,
      decoded.email,
      req.headers['user-agent'] || 'Token Refresh'
    );
    
    // Set new token as cookie with environment-aware settings
    res.cookie("token", newToken, cookieOptions);
    
    return res.status(200).json({ 
      message: "Token refreshed successfully",
      token: newToken  // Important: return the token in the response body too
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(401).json({ message: "Token refresh failed" });
  }
});

// Add this near the top of the file, after your imports
const createAndStoreToken = async (userUuid, email, deviceInfo = null) => {
  const token = jwt.sign(
    { userUUID: userUuid, uuid: userUuid, email: email }, 
    secret, 
    { expiresIn: '24h' }
  );
  
  // Calculate expiration time based on the same duration as the JWT
  const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Store token hash in database with matching expiration
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await userRepo.storeToken(userUuid, tokenHash, 'ACCESS', expiresAt, deviceInfo);
  
  return token;
};

export default router;