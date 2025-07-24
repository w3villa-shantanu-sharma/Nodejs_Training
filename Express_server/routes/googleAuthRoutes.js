const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

const router = express.Router();

// Initiate Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
router.get(
  '/google/callback',
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
    const token = jwt.sign({ uuid: user.uuid }, secret, { expiresIn });

    // Determine next action based on user completion status
    let redirectUrl;

    if (user.next_action) {
      // User needs to complete onboarding steps
      redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}&next_action=${user.next_action}&email=${encodeURIComponent(user.email)}`;
    } else {
      // User profile is complete
      redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}&next_action=null`;
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
}

// // Initiate Facebook login
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// // Facebook callback
// router.get(
//   '/facebook/callback',
//   passport.authenticate('facebook', { session: false }),
//   (req, res) => {
//     const user = req.user;
//     const token = jwt.sign(
//       { uuid: user.uuid, email: user.email, method: 'FACEBOOK' },

//       secret,
//       { expiresIn }
//     );

//     // ✅ Redirect to frontend with token and user info
//     const redirectUrl = `http://localhost:5173/oauth-success?token=${token}&name=${encodeURIComponent(
//       user.name
//     )}&email=${encodeURIComponent(user.email)}&uuid=${user.uuid}`;
//     return res.redirect(redirectUrl);
//   }
// );
module.exports = router;
