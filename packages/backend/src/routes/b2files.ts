import path from "path";
import fs from "fs/promises";
import { Router } from "express";
import multer from "multer";
import { B2File, B2FileDownload } from "../models";
import { isAuthenticated } from "../middleware/auth";
import { authorizeAndGetUploadUrl, uploadFileToB2 } from "../lib/b2";

const router: Router = Router();

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "..", "..", "uploads"),
  filename: (_req, file, cb) => {
    const timestamp = formatTimestamp(new Date());
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    cb(null, `${originalName}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/", isAuthenticated, async (_req, res) => {
  try {
    const files = await B2File.findAll({
      include: [{ model: B2FileDownload, as: "downloads", attributes: ["id"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(files);
  } catch {
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

router.post("/", isAuthenticated, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const tempPath = req.file.path;

  try {
    const now = new Date();
    const timestamp = formatTimestamp(now);
    const dateDir = formatDate(now);
    const originalName = path.parse(req.file.originalname).name;
    const ext = path.extname(req.file.originalname);
    const slug = `${originalName}-${timestamp}`;
    const fileName = `${dateDir}/${slug}${ext}`;
    const publicUrl = `${process.env.BACKBLAZE_PUBLIC_URL || ""}${fileName}`;

    const fileData = await fs.readFile(tempPath);
    const { uploadUrl, authorizationToken } = await authorizeAndGetUploadUrl(
      process.env.BACKBLAZE_BUCKET_ID || ""
    );
    await uploadFileToB2(uploadUrl, authorizationToken, fileName, fileData, req.file.mimetype);

    await fs.unlink(tempPath);

    const record = await B2File.create({
      name: req.file.originalname,
      publicUrl,
      slug,
      notes: req.body.notes || null,
    });

    res.status(201).json(record);
  } catch (err) {
    await fs.unlink(tempPath).catch(() => {});
    console.error("B2 upload error:", err);
    res.status(500).json({ message: "Failed to upload file" });
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const record = await B2File.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "File not found" });
    }
    await record.destroy();
    res.json({ message: "File deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete file" });
  }
});

export default router;
