// // require('dotenv').config({ path: __dirname + '/../.env' });
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const userRepo = require('../utils/userQueryData');
// const { v4: uuidv4 } = require('uuid');
// // /home/w3villa/Documents/NodeJs/Express_server/.env

// console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID ,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
//   callbackURL: "http://localhost:4000/api/users/auth/google/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;
//     const name = profile.displayName;
//     const googleId = profile.id;

//     let user = (await userRepo.getUserByEmail(email))?.[0];

//     if (user) {
//       if (!user.google_id) {
//         await userRepo.linkGoogleId(user.uuid, googleId);
//       }
//     } else {
//       const uuid = uuidv4();
//       await userRepo.insertUser({
//         uuid,
//         name,
//         email,
//         google_id: googleId,
//         is_active: true,
//         next_action: 'PROFILE_UPDATED'
//       });
//       user = await userRepo.getUserByUUID(uuid);
//     }

//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// }));

const passport = require("passport");
const bcrypt = require("bcrypt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { v4: uuidv4 } = require("uuid");
const userRepo = require("../utils/userQueryData");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google profile :" ,profile);
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        let user = (await userRepo.findByEmail(email))?.[0];

        if (user) {
          // CASE B ─ user exists from EMAIL flow, but no Google yet
          if (!user.google_id) {
            await userRepo.updateGoogleId(user.uuid, googleId);
            await userRepo.updateLoginMethod(user.uuid, "GOOGLE"); // helper you add
            user.google_id = googleId;
            user.login_method = "GOOGLE";
          }
        } else {
          const uuid = uuidv4();
          const defaultPassword = await bcrypt.hash(uuidv4(), 10); // Fixed: was uuidv()

          await userRepo.createGoogleUser({
            uuid,
            name,
            email,
            google_id: googleId,
            method: "GOOGLE",
            password : await bcrypt.hash(uuidv() ,10),
            is_active: true,
            next_action: "PROFILE_UPDATED",
          });
          user = (await userRepo.getUserByUUID(uuid))?.[0];
        }

        return done(null, user);
      } catch (err) {
        console.error("Google Oauth error:", err);
        return done(err, null);
      }
    }
  )
);

// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: "http://localhost:4000/api/users/auth/facebook/callback",
//   profileFields: ['id', 'displayName', 'emails']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;
//     const name = profile.displayName;
//     const facebookId = profile.id;

//     let user = await userRepo.findByEmail(email);
//     if (user) {
//       if (!user.facebook_id) {
//         await userRepo.updateFacebookId(user.uuid, facebookId);
//         user.facebook_id = facebookId;
//       }
//     } else {
//       const uuid = uuidv4();
//       await userRepo.createFacebookUser({ uuid, name, email, facebookId });
//       user = await userRepo.getUserByUUID(uuid);
//     }

//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// }));
