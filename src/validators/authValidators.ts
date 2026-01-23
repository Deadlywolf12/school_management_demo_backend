import { z } from "zod";

// Common reusable schemas
const emailSchema = z
  .string()
  .email("Invalid email format")
  .transform((e) => e.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .transform((p) => p.trim());

const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

// Valid roles
const validRoles = ["student", "parent", "staff", "admin", "teacher"];

const roleSchema = z
  .string()
  .transform((r) => r.trim().toLowerCase())
  .refine((r) => validRoles.includes(r), {
    message: `Role must be one of: ${validRoles.join(", ")}`,
  });

// ============================================
// AUTH SCHEMAS - WRAPPED FOR validate()
// ============================================

/**
 * Signup Schema
 * POST /auth/signup
 */
export const signupSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
  }),
});

/**
 * Create User Schema (Admin only)
 * POST /admin/createUsers
 */
export const createUsersSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
  }),
});

/**
 * Login Schema
 * POST /auth/login
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

/**
 * Request OTP Schema
 * POST /auth/request-otp
 */
export const requestOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * Resend OTP Schema
 * POST /auth/resend-otp
 */
export const resendOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * Verify OTP Schema
 * POST /auth/verify-otp
 */
export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: otpSchema,
  }),
});

/**
 * Change Password Schema (Authenticated user)
 * PUT /auth/change-password
 */
export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
});

/**
 * Forgot Password Schema
 * POST /auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
    newPassword: passwordSchema,
    otp: otpSchema,
  }),
});

/**
 * Change Name Schema
 * PUT /user/name
 */
export const changeNameSchema = z.object({
  body: z.object({
    newName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .transform((n) => n.trim()),
  }),
});

/**
 * Update Name Schema (Alternative)
 * PUT /user/profile/name
 */
export const updateNameSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .transform((n) => n.trim()),
  }),
});

/**
 * Change Avatar Schema
 * PUT /user/avatar
 */
export const changeAvatarSchema = z.object({
  body: z.object({
    newAvatar: z
      .string()
      .url("Avatar must be a valid URL")
      .or(z.string().startsWith("data:image/", "Avatar must be a valid image URL or data URI")),
  }),
});

/**
 * Update Avatar Schema (Alternative)
 * PUT /user/profile/avatar
 */
export const updateAvatarSchema = z.object({
  body: z.object({
    avatar: z
      .string()
      .url("Avatar must be a valid URL")
      .or(z.string().startsWith("data:image/", "Avatar must be a valid image URL or data URI")),
  }),
});

/**
 * Change Email Schema
 * PUT /auth/change-email
 */
export const changeEmailSchema = z.object({
  body: z.object({
    password: passwordSchema,
    newEmail: emailSchema,
    otp: otpSchema.optional(), // Optional if OTP verification happens separately
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SignupInput = z.infer<typeof signupSchema>;
export type CreateUsersInput = z.infer<typeof createUsersSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangeNameInput = z.infer<typeof changeNameSchema>;
export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type ChangeAvatarInput = z.infer<typeof changeAvatarSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;