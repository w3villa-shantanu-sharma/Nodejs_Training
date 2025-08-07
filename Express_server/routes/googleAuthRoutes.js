import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { secret, expiresIn } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';
import { config } from '../config/environment.js';

const router = express.Router();

// Helper function to create and store token (same as in newAuthController)
const createAndStoreToken = async (userUuid, email, deviceInfo = null) => {
  // Create token using the expiresIn from config (which is now 24h)
  const token = jwt.sign(
    { userUUID: userUuid, uuid: userUuid, email: email }, 
    secret, 
    { expiresIn }
  );
  
  // Calculate expiration time based on the same duration as the JWT
  // Convert the string "24h" to milliseconds
  const expiresInMs = expiresIn.includes('h') 
    ? parseInt(expiresIn) * 60 * 60 * 1000 
    : 24 * 60 * 60 * 1000; // Default to 24 hours
  
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Store token hash in database with matching expiration
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await userRepo.storeToken(userUuid, tokenHash, 'ACCESS', expiresAt, deviceInfo);
  
  return token;
};

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }), 
  handleGoogleCallback
);

// Handler function for Google OAuth callback
async function handleGoogleCallback(req, res) {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }

  try {
    const user = req.user;
    
    // Use the same token creation system as regular login
    const deviceInfo = req.headers['user-agent'] || 'Google OAuth';
    const token = await createAndStoreToken(user.uuid, user.email, deviceInfo);

    // Set the token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    // Determine next action based on user completion status
    let redirectUrl;

    if (user.next_action) {
      // User needs to complete onboarding steps
      redirectUrl = `${config.FRONTEND_URL}/oauth-success?next_action=${user.next_action}&email=${encodeURIComponent(user.email)}`;
    } else {
      // User profile is complete
      redirectUrl = `${config.FRONTEND_URL}/oauth-success?next_action=null`;
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
}

export default router;
