const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

const router = express.Router();

// Initiate Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
// Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { uuid: user.uuid, email: user.email, method: 'GOOGLE' },
      secret,
      { expiresIn }
    );

    console.log("Google login successful, user:", user);

    //  Redirect to frontend with token and user info in query string
    const redirectUrl = `http://localhost:5173/oauth-success?token=${token}&name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email)}&uuid=${user.uuid}`;
    return res.redirect(redirectUrl);
  }
);

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
