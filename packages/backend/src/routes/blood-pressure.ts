import { Router } from "express";
import { Op } from "sequelize";
import { BloodPressure } from "../models";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

router.use(isAuthenticated);

router.get("/", async (req, res) => {
  try {
    let days = Number(req.query.days);
    if (isNaN(days)) days = 30;

    const where: Record<string, unknown> = {};
    if (days > 0) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      where.dateTime = { [Op.gte]: fromDate };
    }

    const records = await BloodPressure.findAll({
      where,
      order: [["dateTime", "DESC"]],
    });

    res.json(records);
  } catch {
    res.status(500).json({ message: "Failed to fetch blood pressure records" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { dateTime, systolic, diastolic, pulse, weight } = req.body;
    const record = await BloodPressure.create({
      dateTime,
      systolic,
      diastolic,
      pulse,
      weight,
    });
    res.status(201).json(record);
  } catch {
    res.status(500).json({ message: "Failed to create blood pressure record" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const record = await BloodPressure.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(record);
  } catch {
    res.status(500).json({ message: "Failed to fetch blood pressure record" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const record = await BloodPressure.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const { dateTime, systolic, diastolic, pulse, weight } = req.body;
    await record.update({ dateTime, systolic, diastolic, pulse, weight });
    res.json(record);
  } catch {
    res.status(500).json({ message: "Failed to update blood pressure record" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const record = await BloodPressure.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    await record.destroy();
    res.json({ message: "Record deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete blood pressure record" });
  }
});

export default router;
