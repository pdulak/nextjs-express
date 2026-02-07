import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models";

export function createGoogleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback";

  if (!clientID || !clientSecret) {
    return null;
  }

  return new GoogleStrategy(
    { clientID, clientSecret, callbackURL },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: "No email from Google" });
        }

        let user = await User.findOne({ where: { email } });
        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName,
            uuid: profile.id,
            is_active: true,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  );
}
