import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { User } from "../models";

export const localStrategy = new LocalStrategy(
  { usernameField: "email" },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Invalid email or password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
);
