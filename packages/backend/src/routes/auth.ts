import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import passport from "passport";
import { User, UserPermission, Permission, FeatureFlag } from "../models";
import { Op } from "sequelize";
import { isAuthenticated } from "../middleware/auth";
import { sendActivationEmail, sendPasswordResetEmail } from "../lib/email";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const flags = await FeatureFlag.findOne();
    if (!flags?.registrationActive) {
      return res.status(403).json({ message: "Registration is currently disabled" });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationHash = crypto.randomBytes(32).toString("hex");
    await User.create({
      name,
      email,
      password: hashedPassword,
      is_active: false,
      activation_hash: activationHash,
    });

    await sendActivationEmail(email, activationHash);

    res.status(201).json({
      message: "Registration successful. Please check your email to activate your account.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({ where: { activation_hash: token } });
    if (!user) {
      return res.status(400).json({ message: "Invalid activation token" });
    }

    await user.update({ is_active: true, activation_hash: null });
    res.json({ message: "Account activated successfully" });
  } catch {
    res.status(500).json({ message: "Activation failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const flags = await FeatureFlag.findOne();
    if (!flags?.forgotPasswordActive) {
      return res.status(403).json({ message: "Password reset is currently disabled" });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to avoid leaking whether the email exists
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const resetHash = crypto.randomBytes(32).toString("hex");
    await user.update({ reset_hash: resetHash });
    await sendPasswordResetEmail(email, resetHash);

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch {
    res.status(500).json({ message: "Failed to process request" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const user = await User.findOne({ where: { reset_hash: token } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword, reset_hash: null });
    res.json({ message: "Password reset successfully" });
  } catch {
    res.status(500).json({ message: "Password reset failed" });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    (err: Error | null, user: InstanceType<typeof User> | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      });
    }
  )(req, res, next);
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (_req, res) => {
    res.redirect(process.env.WEBSITE_URL || "http://localhost:3000");
  }
);

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
});

router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as InstanceType<typeof User>;
    const userPermissions = await UserPermission.findAll({
      where: { userId: user.id },
      include: [{ model: Permission }],
    });
    const permissions = userPermissions
      .map((up: any) => up.Permission?.code)
      .filter(Boolean);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      permissions,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as InstanceType<typeof User>;
    const { name, email } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({
        where: { email, id: { [Op.ne]: user.id } },
      });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    await user.update({ name, email });
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.put("/change-password", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as InstanceType<typeof User>;
    const { currentPassword, newPassword } = req.body;

    if (!user.password) {
      return res.status(400).json({ message: "Account uses external login" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ message: "Failed to change password" });
  }
});

export default router;
