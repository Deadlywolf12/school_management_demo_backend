
import { Request, Response } from "express";
import { db } from "../db";
import { users, NewUser } from "../db/schema/users";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { NewOtp, otps } from "../db/schema/otps";

import { handleOtpRequest } from "../helpers/auth/handleOtps";
import { createDefaultCategoriesForUser } from "../helpers/category/defaultCategoriesAdder";


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

interface ChangePasswordBody{
  oldPassword:string;
  newPassword:string;
}
type ChangePasswordRequest = AuthRequest & { body: ChangePasswordBody };

interface forgotPasswordBody{
  email: string;
  otp:string;
  newPassword:string;
}
const getJwtSecret = (): Secret => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return process.env.JWT_SECRET as Secret;
};


// Controllers



export const forgotPassword = async (req: Request<{}, {}, forgotPasswordBody>, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const emailNormalized = email.trim().toLowerCase();

    const isVerified = await db.query.otps.findFirst({
      where: (table, { and, eq, gt }) =>
        and(
          eq(table.email, emailNormalized),
          eq(table.otp, otp),
          eq(table.purpose, "forgotPassword"),
          gt(table.expiresAt, new Date())
        ),
    });

    if (!isVerified) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

 
    await db.delete(otps).where(eq(otps.id, isVerified.id));

   
    const hashedPassword = await bcrypt.hash(newPassword, 8);

   
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, emailNormalized))
      .returning();

    if (!result || result.length === 0) {
      return res.status(400).json({ success: false, msg: "Failed to change password" });
    }

    return res.status(200).json({ success: true, msg: "Password changed successfully" });
  } catch (err) {
    console.error("ForgotPassword error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};



export const changePassword = async (
  req: ChangePasswordRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!existingUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const isOldPassValid = await bcrypt.compare(oldPassword, existingUser.password);
    if (!isOldPassValid) {
      return res.status(400).json({ success: false, msg: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 8);

    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      return res.status(400).json({ success: false, msg: "Failed to update password" });
    }

    return res.status(200).json({ success: true, msg: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


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

export const reqOtp = async (req: Request, res: Response, purposeArg?: string) => {
  try {
    const { email } = req.body;
    const purpose = purposeArg || req.body.purpose || "signup"; 

    const result = await handleOtpRequest(email, { forResend: false, purpose });

    if (!result.success) {
      return res.status(result.msg.includes("Please wait") ? 429 : 400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error("Request OTP error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


export const resendOtp = async (req: Request, res: Response, purposeArg?: string) => {
  try {
    const { email } = req.body;
    const purpose = purposeArg || req.body.purpose || "signup"; 

    if (!email?.trim()) {
      return res.status(400).json({ success: false, msg: "Email is required" });
    }

    const result = await handleOtpRequest(email, { forResend: true, purpose });
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

    await createDefaultCategoriesForUser(user.id);

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


export const changeEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { password, newEmail, otp } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }


    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!existingUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, msg: "Incorrect password" });
    }

   
    const [emailTaken] = await db
      .select()
      .from(users)
      .where(eq(users.email, newEmail.trim().toLowerCase()));
    if (emailTaken) {
      return res.status(400).json({ success: false, msg: "Email already in use" });
    }

   
    const otpRecord = await db.query.otps.findFirst({
      where: (table, { and, eq, gt }) =>
        and(
          eq(table.email, newEmail.trim().toLowerCase()),
          eq(table.otp, otp),
          eq(table.purpose, "changeEmail"),
          gt(table.expiresAt, new Date())
        ),
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

  
    await db.delete(otps).where(eq(otps.id, otpRecord.id));


    const result = await db
      .update(users)
      .set({ email: newEmail.trim().toLowerCase() })
      .where(eq(users.id, req.user.id))
      .returning();

    if (result.length === 0) {
      return res.status(400).json({ success: false, msg: "Failed to update email" });
    }

    return res.status(200).json({ success: true, msg: "Email updated successfully" });
  } catch (err) {
    console.error("ChangeEmail error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
