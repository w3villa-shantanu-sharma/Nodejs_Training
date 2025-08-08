import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { secret, expiresIn } from '../config/jwt.js';
import * as userRepo from '../utils/userQueryData.js';
import { config, cookieOptions } from '../config/environment.js'; // Import cookieOptions

const router = express.Router();

// Helper function to create and store token
const createAndStoreToken = async (userUuid, email, deviceInfo = null) => {
  const token = jwt.sign(
    { userUUID: userUuid, uuid: userUuid, email: email }, 
    secret, 
    { expiresIn }
  );
  
  const expiresInMs = expiresIn.includes('h') 
    ? parseInt(expiresIn) * 60 * 60 * 1000 
    : 24 * 60 * 60 * 1000;
    
  const expiresAt = new Date(Date.now() + expiresInMs);
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
    return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_failed`);
  }

  try {
    const user = req.user;
    
    // Use the same token creation system as regular login
    const deviceInfo = req.headers['user-agent'] || 'Google OAuth';
    const token = await createAndStoreToken(user.uuid, user.email, deviceInfo);

    // Set the token as HTTP-only cookie using centralized options
    res.cookie("token", token, cookieOptions);

    // Determine next action based on user completion status
    let redirectUrl;
    
    if (user.next_action) {
      // User needs to complete onboarding steps
      redirectUrl = `${config.FRONTEND_URL}/oauth-success?next_action=${user.next_action}&email=${encodeURIComponent(user.email)}`;
    } else {
      // User profile is complete
      redirectUrl = `${config.FRONTEND_URL}/oauth-success?next_action=null`;
    }

    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(`${config.FRONTEND_URL}/login?error=oauth_failed`);
  }
}

export default router;
