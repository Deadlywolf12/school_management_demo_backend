import { z } from "zod";

// Common reusable schemas
const emailSchema = z.string().email("Invalid email format").transform(e => e.trim().toLowerCase());
const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

// Signup
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").transform(n => n.trim()),
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters").transform(p => p.trim()),
  otp: otpSchema,
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
  otp: z.string().length(6, "OTP must be 6 digits"),
});

