import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Permission, UserPermission } from "../models";
import { isAuthenticated, hasPermission } from "../middleware/auth";

const router = Router();

router.use(isAuthenticated, hasPermission("admin"));

router.get("/", async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "is_active", "createdAt"],
    });

    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const userPermissions = await UserPermission.findAll({
          where: { userId: user.id },
          include: [{ model: Permission }],
        });
        const permissions = userPermissions
          .map((up: any) => up.Permission?.code)
          .filter(Boolean);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          is_active: user.is_active,
          createdAt: user.createdAt,
          permissions,
        };
      })
    );

    res.json(usersWithPermissions);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "email", "is_active", "createdAt"],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPermissions = await UserPermission.findAll({
      where: { userId: user.id },
      include: [{ model: Permission }],
    });
    const permissions = userPermissions
      .map((up: any) => up.Permission?.code)
      .filter(Boolean);

    const allPermissions = await Permission.findAll({
      attributes: ["id", "name", "code"],
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        createdAt: user.createdAt,
        permissions,
      },
      allPermissions,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, is_active } = req.body;
    await user.update({ name, email, is_active });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      is_active: user.is_active,
    });
  } catch {
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.put("/:id/password", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password } = req.body;
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: "Password updated" });
  } catch {
    res.status(500).json({ message: "Failed to update password" });
  }
});

router.put("/:id/permissions", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { permissionCodes } = req.body as { permissionCodes: string[] };

    await UserPermission.destroy({ where: { userId: user.id } });

    if (permissionCodes && permissionCodes.length > 0) {
      const permissions = await Permission.findAll({
        where: { code: permissionCodes },
      });
      await UserPermission.bulkCreate(
        permissions.map((p) => ({ userId: user.id, permissionId: p.id }))
      );
    }

    res.json({ message: "Permissions updated" });
  } catch {
    res.status(500).json({ message: "Failed to update permissions" });
  }
});

export default router;
