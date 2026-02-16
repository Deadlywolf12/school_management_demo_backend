
import { Request, Response } from "express";
import { db } from "../db";
import { users, NewUser } from "../db/schema/users";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { NewOtp, otps } from "../db/schema/otps";

import { handleOtpRequest } from "../helpers/auth/handleOtps";
import { students } from "../db/schema/students";
import { staff } from "../db/schema/staff";
import { teachers } from "../db/schema/teacher";

type UserRole = "admin" | "teacher" | "student" | "parent" | "staff";

interface SignupBody {
  role: UserRole;
 
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

// interface forgotPasswordBody{
//   email: string;
//   otp:string;
//   newPassword:string;
// }
const getJwtSecret = (): Secret => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return process.env.JWT_SECRET as Secret;
};


// Controllers



// export const forgotPassword = async (req: Request<{}, {}, forgotPasswordBody>, res: Response) => {
//   try {
//     const { email, otp, newPassword } = req.body;
//     const emailNormalized = email.trim().toLowerCase();

//     const isVerified = await db.query.otps.findFirst({
//       where: (table, { and, eq, gt }) =>
//         and(
//           eq(table.email, emailNormalized),
//           eq(table.otp, otp),
//           eq(table.purpose, "forgotPassword"),
//           gt(table.expiresAt, new Date())
//         ),
//     });

//     if (!isVerified) {
//       return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
//     }

 
//     await db.delete(otps).where(eq(otps.id, isVerified.id));

   
//     const hashedPassword = await bcrypt.hash(newPassword, 8);

   
//     const result = await db
//       .update(users)
//       .set({ password: hashedPassword })
//       .where(eq(users.email, emailNormalized))
//       .returning();

//     if (!result || result.length === 0) {
//       return res.status(400).json({ success: false, msg: "Failed to change password" });
//     }

//     return res.status(200).json({ success: true, msg: "Password changed successfully" });
//   } catch (err) {
//     console.error("ForgotPassword error:", err);
//     return res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };



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


// export const getProfile = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ success: false, msg: "Unauthorized" });
//     }
//     const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
//     if (!user) {
//       return res.status(404).json({ success: false, msg: "User not found" });
//     }
//     const { password, ...safeUser } = user;
//     res.json({ success: true, user: safeUser, token: req.token });
//   } catch (e) {
//     res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };

// export const reqOtp = async (req: Request, res: Response, purposeArg?: string) => {
//   try {
//     const { email } = req.body;
//     const purpose = purposeArg || req.body.purpose || "signup"; 

//     const result = await handleOtpRequest(email, { forResend: false, purpose });

//     if (!result.success) {
//       return res.status(result.msg.includes("Please wait") ? 429 : 400).json(result);
//     }

//     res.json(result);
//   } catch (err) {
//     console.error("Request OTP error:", err);
//     res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };


// export const resendOtp = async (req: Request, res: Response, purposeArg?: string) => {
//   try {
//     const { email } = req.body;
//     const purpose = purposeArg || req.body.purpose || "signup"; 

//     if (!email?.trim()) {
//       return res.status(400).json({ success: false, msg: "Email is required" });
//     }

//     const result = await handleOtpRequest(email, { forResend: true, purpose });
//     if (!result.success) {
//       return res.status(result.msg.includes("Please wait") ? 429 : 400).json(result);
//     }

//     res.json(result);
//   } catch (err) {
//     console.error("Resend OTP error:", err);
//     res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };


export const signup = async (req: Request<{}, {}, SignupBody>, res: Response) => {
  try {
     const { email,password, role } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized));

    if (existingUser) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create new user
    const newUser = { email: emailNormalized, password: hashedPassword, role };

    const insertedUsers = await db.insert(users).values(newUser).returning();
    const user = insertedUsers[0];

    if (!user) {
      return res.status(500).json({ success: false, msg: "Failed to create user" });
    }

    // Remove password before returning
    const { password: _, ...safeUser } = user;

    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


export const signin = async (req: Request<{}, {}, SigninBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized));

    if (!existingUser) {
      return res.status(400).json({ success: false, msg: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, msg: "Incorrect password" });
    }

    if (existingUser.status === "deactivated") {
      return res.status(400).json({
        success: false,
        msg: "Your account is deactivated, please contact admin for more info",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      getJwtSecret(),
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      } as SignOptions
    );

    let name: string | null = null;
    let classId: string | null = null;

    if (existingUser.role === "student") {
      const [studentProfile] = await db
        .select()
        .from(students)
        .where(eq(students.userId, existingUser.id));

      name = studentProfile?.name || null;
      classId = studentProfile?.classId || null;
    }

    if (existingUser.role === "teacher") {
      const [teacherProfile] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.userId, existingUser.id));

      name = teacherProfile?.name || null;
    }

    if (existingUser.role === "staff") {
      const [staffProfile] = await db
        .select()
        .from(staff)
        .where(eq(staff.userId, existingUser.id));

      name = staffProfile?.name || null;
    }

    const { password: _, ...safeUser } = existingUser;

    res.json({
      success: true,
      user: safeUser,
      name,
      classId, 
      token,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


export const changeEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { password, newEmail} = req.body;

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

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
if (!id) {
      return res.status(400).json({ success: false, msg: "User ID is required" });
    }
    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    if (!existingUser) {
      return res.status(400).json({ success: false, msg: "User not found" });
    }

   
    const newStatus = existingUser.status === "active" ? "deactivated" : "active";

   
    await db
      .update(users)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(users.id, id));

    res.json({ 
      success: true, 
      msg: `Account successfully ${newStatus}`, 
      newStatus: newStatus 
    });
  } catch (err) {
    console.error("Toggle error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


// export const changeName = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.user) return res.status(401).json({ success: false, msg: "Unauthorized" });

//     const userId = req.user.id;
//     const { newName } = req.body as { newName: string };

//     if (!newName || newName.trim() === "") {
//       return res.status(400).json({ success: false, msg: "New name is required" });
//     }

//     const [existingUser] = await db.select().from(users).where(eq(users.id, userId));

//     if (!existingUser) return res.status(404).json({ success: false, msg: "User not found" });
//     if (existingUser.name === newName) {
//       return res.status(400).json({ success: false, msg: "New name cannot be same as old name" });
//     }

//     const updated = await db
//       .update(users)
//       .set({ name: newName })
//       .where(eq(users.id, userId))
//       .returning();

//     if (updated.length === 0) {
//       return res.status(500).json({ success: false, msg: "Couldn't update name" });
//     }

//     res.status(200).json({ success: true, msg: "Name updated successfully" });
//   } catch (err) {
//     console.error("changeName error:", err);
//     res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };

// export const changeAvatar = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.user) return res.status(401).json({ success: false, msg: "Unauthorized" });

//     const userId = req.user.id;
//     const { avatarName } = req.body as { avatarName: string };

   

//     const [existingUser] = await db.select().from(users).where(eq(users.id, userId));

//     if (!existingUser) return res.status(404).json({ success: false, msg: "User not found" });
//     if (existingUser.avatar === avatarName) {
//       return res.status(400).json({ success: false, msg: "Selected avatar is already in use" });
//     }

//     const updated = await db
//       .update(users)
//       .set({ avatar: avatarName })
//       .where(eq(users.id, userId))
//       .returning();

//     if (updated.length === 0) {
//       return res.status(500).json({ success: false, msg: "Couldn't update avatar" });
//     }

//     res.status(200).json({ success: true, msg: "Avatar updated successfully", avatar: avatarName });
//   } catch (err) {
//     console.error("changeAvatar error:", err);
//     res.status(500).json({ success: false, msg: "Internal server error" });
//   }
// };