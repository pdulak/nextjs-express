import { Router } from "express";
import { FeatureFlag } from "../models";
import { isAuthenticated, hasPermission } from "../middleware/auth";

const router = Router();

router.use(isAuthenticated, hasPermission("admin"));

router.get("/", async (_req, res) => {
  try {
    const flags = await FeatureFlag.findOne();
    if (!flags) {
      return res.status(404).json({ message: "Feature flags not found" });
    }
    res.json({
      registrationActive: flags.registrationActive,
      forgotPasswordActive: flags.forgotPasswordActive,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch feature flags" });
  }
});

router.put("/", async (req, res) => {
  try {
    const flags = await FeatureFlag.findOne();
    if (!flags) {
      return res.status(404).json({ message: "Feature flags not found" });
    }

    const { registrationActive, forgotPasswordActive } = req.body;
    await flags.update({ registrationActive, forgotPasswordActive });

    res.json({
      registrationActive: flags.registrationActive,
      forgotPasswordActive: flags.forgotPasswordActive,
    });
  } catch {
    res.status(500).json({ message: "Failed to update feature flags" });
  }
});

export default router;
