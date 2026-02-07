import passport from "passport";
import { User } from "../models";
import { localStrategy } from "./local";
import { createGoogleStrategy } from "./google";

passport.use(localStrategy);

const googleStrategy = createGoogleStrategy();
if (googleStrategy) {
  passport.use(googleStrategy);
}

passport.serializeUser((user, done) => {
  done(null, (user as InstanceType<typeof User>).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
