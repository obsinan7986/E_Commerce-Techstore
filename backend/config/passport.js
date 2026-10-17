/**
 * Passport Google OAuth 2.0 strategy.
 * On successful auth, finds or creates the user in MongoDB and
 * attaches the full user document to req.user.
 *
 * If GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set the strategy is
 * skipped gracefully so the server still boots without Google OAuth.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import User     from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const clientID     = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const defaultCallback = process.env.RENDER_EXTERNAL_URL
  ? `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`
  : "http://localhost:5000/api/auth/google/callback";
const callbackURL  = process.env.GOOGLE_CALLBACK_URL || defaultCallback;

if (clientID && clientSecret) {
  const { Strategy: GoogleStrategy } =
    await import("passport-google-oauth20");

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email        = profile.emails?.[0]?.value?.toLowerCase();
          const googleId     = profile.id;
          const fullName     = profile.displayName || "Google User";
          const profileImage = profile.photos?.[0]?.value || "";

          if (!email) return done(new Error("Google account has no email."), null);

          // 1 — find by googleId
          let user = await User.findOne({ googleId });

          if (!user) {
            // 2 — find by email (link existing account)
            user = await User.findOne({ email });

            if (user) {
              user.googleId     = googleId;
              user.authProvider = "google";
              if (!user.profileImage) user.profileImage = profileImage;
              if (!user.status)       user.status = "active";
              await user.save();
            } else {
              // 3 — create new account
              user = await User.create({
                fullName,
                email,
                googleId,
                authProvider:  "google",
                profileImage,
                phone:         "",
                password:      null,
                role:          "customer",
                status:        "active",
                isAdmin:       false,
              });
            }
          }

          if (user.isSuspended || user.status === "suspended") {
            return done(new Error("Account is suspended. Please contact support."), null);
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  console.log("✅  Google OAuth strategy registered.");
} else {
  console.warn(
    "⚠️   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — " +
    "Google OAuth is disabled. Set them in Render environment variables to enable."
  );
}

// Serialize/deserialize are required by Passport even without sessions.
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
