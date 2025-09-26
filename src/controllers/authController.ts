
import { Request, Response } from "express";
import { db } from "../db";
import { users, NewUser } from "../db/schema/users";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { NewOtp, otps } from "../db/schema/otps";

import { handleOtpRequest } from "../helpers/auth/handleOtps";


interface SignupBody {
  otp: string;
  name: string;
  email: string;
  password: string;
}
interface SigninBody {
  email: string;
  password: string;
}

const getJwtSecret = (): Secret => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return process.env.JWT_SECRET as Secret;
};


// Controllers


export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    const { password, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: req.token });
  } catch (e) {
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const reqOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
  

    const result = await handleOtpRequest(email, { forResend: false });
    if (!result.success) {
      return res.status(result.msg.includes("Please wait") ? 429 : 400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error("Request OTP error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ success: false, msg: "Email is required" });
    }

    const result = await handleOtpRequest(email, { forResend: true });
    if (!result.success) {
      return res.status(result.msg.includes("Please wait") ? 429 : 400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const signup = async (req: Request<{}, {}, SignupBody>, res: Response) => {
  try {
    const { email, name, password, otp } = req.body;
  
    const emailNormalized = email.trim().toLowerCase();

    const isVerified = await db.query.otps.findFirst({
      where: (table, { and, eq, gt }) =>
        and(eq(table.email, emailNormalized), eq(table.otp, otp), gt(table.expiresAt, new Date())),
    });
    if (!isVerified) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }
    await db.delete(otps).where(eq(otps.id, isVerified.id));

    const hashedPassword = await bcrypt.hash(password, 8);
    const newUser: NewUser = { email: emailNormalized, name, password: hashedPassword };

    const insertedUsers = await db.insert(users).values(newUser).returning();
    const user = insertedUsers[0];
    if (!user) {
      return res.status(500).json({ success: false, msg: "Failed to create user" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as SignOptions);

    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, user: safeUser, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const signin = async (req: Request<{}, {}, SigninBody>, res: Response) => {
  try {
    const { email, password } = req.body;
 
    const emailNormalized = email.trim().toLowerCase();

    const [existingUser] = await db.select().from(users).where(eq(users.email, emailNormalized));
    if (!existingUser) {
      return res.status(400).json({ success: false, msg: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, msg: "Incorrect password" });
    }

    const token = jwt.sign({ id: existingUser.id, email: existingUser.email }, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as SignOptions);

    const { password: _, ...safeUser } = existingUser;
    res.json({ success: true, user: safeUser, token });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
