import { z } from "zod";

// Common reusable schemas
const emailSchema = z.string().email("Invalid email format").transform(e => e.trim().toLowerCase());
const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");



// Signup



const validRoles = ["student", "parent", "staff", "admin"];

export const signupSchema = z.object({
  name: z.string().min(2).transform(n => n.trim()),
  email: z.string().email().transform(e => e.trim().toLowerCase()),
  password: z.string().min(6).transform(p => p.trim()),
  role: z
    .string()
    .transform(r => r.trim().toLowerCase())
    .refine(r => validRoles.includes(r), {
      message: `Role must be one of: ${validRoles.join(", ")}`,
    }),
});

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password required").transform(p => p.trim()),
});

// Request OTP
export const requestOtpSchema = z.object({
  email: emailSchema,
});

// Resend OTP
export const resendOtpSchema = z.object({
  email: emailSchema,
});

// changepassword
export const changePasswordSchema = z.object({
 
  oldPassword: z.string().min(6, "Password required").transform(p => p.trim()),
  newPassword:z.string().min(6, "Password required").transform(p => p.trim()),
});

// changeName
export const changeNameSchema = z.object({
 
 newName: z.string().min(2, "Name must be at least 2 characters").transform(n => n.trim()),
});
// changeAvatar
export const changeAvatarSchema = z.object({
 
 newAvatar: z.string()
});




// forgotPass
export const forgotPasswordSchema = z.object({
  email: emailSchema,
  newPassword:z.string().min(6, "Password required").transform(p => p.trim()),
   otp: z.string().length(6, "OTP must be 6 digits"),
});
// forgotPass
export const updateNameSchema = z.object({
  name:z.string().min(2, "Name must be at least 2 characters").transform(p => p.trim()),
});
export const updateAvatarSchema = z.object({
  avatar:z.string().min(2, "Avatar should be more than 2 chr").transform(p => p.trim()),
});

export const changeEmailSchema = z.object({
  password: z.string().min(6, "Password required"),
  newEmail: emailSchema,
  // otp: z.string().length(6, "OTP must be 6 digits"),
});

