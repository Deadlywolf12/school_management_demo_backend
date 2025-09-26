import { UUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";
import { db } from "../db";

dotenv.config();

export interface AuthPayload {
  id: UUID;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  token?: string;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      res.status(401).json({ success: false, msg: "No auth provided, access denied" });
      return;
    }
console.log("JWT_SECRET from env:", process.env.JWT_SECRET);

    let verified;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET as Secret) as AuthPayload;
    } catch {
      res.status(401).json({ success: false, msg: "Invalid or expired token" });
      return;
    }

    // Check user in DB
    const [user] = await db.select().from(users).where(eq(users.id, verified.id));
    if (!user) {
      res.status(401).json({ success: false, msg: "User not found" });
      return;
    }

    req.user = verified;
    req.token = token;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
