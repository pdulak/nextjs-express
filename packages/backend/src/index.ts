import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./passport";
import sequelize from "./config/database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import featureFlagRoutes from "./routes/feature-flags";
import bloodPressureRoutes from "./routes/blood-pressure";

// Import models to register associations
import { FeatureFlag, User, Permission, UserPermission, BloodPressure } from "./models";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.WEBSITE_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/feature-flags", featureFlagRoutes);
app.use("/blood-pressure", bloodPressureRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  try {
    await sequelize.sync();
    console.log("Database synced");

    await seedFeatureFlags();
    await seedPermissions();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

async function seedFeatureFlags() {
    const flagCount = await FeatureFlag.count();
    if (flagCount === 0) {
        await FeatureFlag.create({
            registrationActive: true,
            forgotPasswordActive: true,
        });
    }
}

async function seedPermissions() {
    const userCount = await User.count();
    if (userCount > 0) {
        // make sure that user #1 has Admin permission set
        const adminPermission = await Permission.findOrCreate({
            where: { code: "admin" },
            defaults: { name: "Admin", code: "admin" },
        });
        await UserPermission.findOrCreate({
            where: { userId: 1, permissionId: adminPermission[0].id },
            defaults: { userId: 1, permissionId: adminPermission[0].id },
        });
        console.log("Admin permission set for user #1");
    }
}

start();
