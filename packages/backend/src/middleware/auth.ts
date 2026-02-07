import type { Request, Response, NextFunction } from "express";
import { UserPermission, Permission } from "../models";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function hasPermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = (req.user as any).id;
      const userPermissions = await UserPermission.findAll({
        where: { userId },
        include: [{ model: Permission, where: { code: permissionCode } }],
      });

      if (userPermissions.length > 0) {
        return next();
      }

      res.status(403).json({ message: "Forbidden" });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
