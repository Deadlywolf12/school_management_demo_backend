import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth"; // your current auth types
import { db } from "../db";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
   
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Not authenticated" });
    }

   
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
      return res.status(401).json({ success: false, msg: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, msg: "Access denied, admin only" });
    }

    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
