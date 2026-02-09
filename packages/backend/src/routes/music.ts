import { Router } from "express";
import { Music } from "../models";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Public routes - GET list and GET single
router.get("/", async (req, res) => {
  try {
    const records = await Music.findAll({
      order: [["title", "ASC"]],
    });
    res.json(records);
  } catch {
    res.status(500).json({ message: "Failed to fetch music sheets" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const record = await Music.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Music sheet not found" });
    }
    res.json(record);
  } catch {
    res.status(500).json({ message: "Failed to fetch music sheet" });
  }
});

// Authenticated routes - POST, PUT, DELETE
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { title, contents } = req.body;

    // Ensure contents is stringified JSON
    const contentsString = typeof contents === 'string'
      ? contents
      : JSON.stringify(contents);

    const record = await Music.create({
      title,
      contents: contentsString,
    });
    res.status(201).json(record);
  } catch {
    res.status(500).json({ message: "Failed to create music sheet" });
  }
});

router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const record = await Music.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Music sheet not found" });
    }

    const { title, contents } = req.body;

    // Ensure contents is stringified JSON
    const contentsString = typeof contents === 'string'
      ? contents
      : JSON.stringify(contents);

    await record.update({ title, contents: contentsString });
    res.json(record);
  } catch {
    res.status(500).json({ message: "Failed to update music sheet" });
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const record = await Music.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Music sheet not found" });
    }

    await record.destroy();
    res.json({ message: "Music sheet deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete music sheet" });
  }
});

export default router;
