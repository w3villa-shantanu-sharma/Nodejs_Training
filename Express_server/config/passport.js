import passport from "passport";
import bcrypt from "bcrypt";
import GoogleStrategy from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";
import * as userRepo from "../utils/userQueryData.js";
import { config } from '../config/environment.js';

passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        let user = (await userRepo.getUserByEmail(email))?.[0];

        if (user) {
          // User exists, link Google account if needed
          if (!user.google_id) {
            await userRepo.updateGoogleId(user.uuid, googleId);
            await userRepo.updateLoginMethod(user.uuid, "GOOGLE");
            user.google_id = googleId;
            user.login_method = "GOOGLE";
          }
        } else {
          // Create new Google user
          const uuid = uuidv4();
          const defaultPassword = await bcrypt.hash(uuidv4(), 10);

          await userRepo.createGoogleUser({
            uuid,
            name,
            email,
            google_id: googleId,
            password: defaultPassword,
          });

          user = (await userRepo.getUserByUUID(uuid));
        }

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

export default passport;
