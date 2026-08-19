/**
 * Passport Google OAuth 2.0 strategy.
 * On successful auth, finds or creates the user in MongoDB and
 * attaches the full user document to req.user.
 */
import passport       from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User           from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email       = profile.emails?.[0]?.value?.toLowerCase();
        const googleId    = profile.id;
        const fullName    = profile.displayName || "Google User";
        const profileImage = profile.photos?.[0]?.value || "";

        if (!email) return done(new Error("Google account has no email."), null);

        // 1 — Try to find by googleId first (fastest)
        let user = await User.findOne({ googleId });

        if (!user) {
          // 2 — Try to find by email (link to existing account)
          user = await User.findOne({ email });

          if (user) {
            // Link Google to existing account
            user.googleId     = googleId;
            user.authProvider = "google";
            if (!user.profileImage) user.profileImage = profileImage;
            await user.save();
          } else {
            // 3 — Create brand-new account
            user = await User.create({
              fullName,
              email,
              googleId,
              authProvider:  "google",
              profileImage,
              phone:         "",
              password:      null,   // no password for Google users
              role:          "customer",
              isAdmin:       false,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We don't use sessions — serialize/deserialize are required by Passport
// but effectively no-ops since we use JWT instead.
passport.serializeUser((user, done)   => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
