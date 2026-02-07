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

// Import models to register associations
import { FeatureFlag } from "./models";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced");

    const flagCount = await FeatureFlag.count();
    if (flagCount === 0) {
      await FeatureFlag.create({
        registrationActive: true,
        forgotPasswordActive: true,
      });
      console.log("Feature flags seeded");
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
