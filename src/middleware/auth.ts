import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";
import { db } from "../db";

dotenv.config();

export interface AuthPayload {
  id: string;   // UUID as string
  email: string;
  role: string; // ← ADD THIS
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  token?: string;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set in environment");
    }

    const token = req.header("x-auth-token");
    if (!token) {
      return res.status(401).json({ success: false, msg: "No auth provided, access denied" });
    }

    let verified: AuthPayload;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET as Secret) as AuthPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, msg: "Token expired" });
      }
      return res.status(401).json({ success: false, msg: "Invalid token" });
    }

    // DB check to see if user still exists AND get their role
    const [user] = await db.select().from(users).where(eq(users.id, verified.id));
    if (!user) {
      return res.status(401).json({ success: false, msg: "User not found" });
    }

    // ← ADD THE ROLE HERE
    req.user = {
      id: verified.id,
      email: verified.email,
      role: user.role  // Get role from database
    };
    
    req.token = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};