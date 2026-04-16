import { Router } from "express";
import { B2File, B2FileDownload } from "../models";

const router = Router();

router.get("/:slug", async (req, res) => {
  try {
    const file = await B2File.findOne({ where: { slug: req.params.slug } });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";

    await B2FileDownload.create({ b2FileId: file.id, ipAddress: ip });

    res.redirect(file.publicUrl);
  } catch {
    res.status(500).json({ message: "Failed to process download" });
  }
});

export default router;
