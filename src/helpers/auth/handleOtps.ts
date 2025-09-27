
import { db } from "../../db";
import { users } from "../../db/schema/users";
import { otps, NewOtp } from "../../db/schema/otps";
import { eq } from "drizzle-orm";
import { checkOtpCoolDown } from "./otpCoolDown";
import { generateOtp } from "./generateOtp";
import { sendOtpEmail } from "./sendEmail";


export async function handleOtpRequest(
  email: string,
  { forResend, purpose }: { forResend: boolean; purpose: "signup" | "forgotPassword" }
): Promise<{ success: boolean; msg: string }> {
  const emailNormalized = email.trim().toLowerCase();

  if (purpose === "signup") {
   
    const existingUser = await db.select().from(users).where(eq(users.email, emailNormalized));
    if (existingUser.length > 0) {
      return { success: false, msg: "Email already registered" };
    }
  } else if (purpose === "forgotPassword") {
  
    const existingUser = await db.select().from(users).where(eq(users.email, emailNormalized));
    if (existingUser.length === 0) {
      return { success: false, msg: "Email not found" };
    }
  }


  const cooldownRemaining = await checkOtpCoolDown(emailNormalized, 60);
  if (cooldownRemaining) {
    return {
      success: false,
      msg: `Please wait ${cooldownRemaining}s before requesting a new OTP`,
    };
  }

 
  await db.delete(otps).where(eq(otps.email, emailNormalized));

 
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const newOtp: NewOtp = { email: emailNormalized, otp, expiresAt, purpose };
  await db.insert(otps).values(newOtp);

 
  await sendOtpEmail(emailNormalized, otp, 15);

  return { 
    success: true,
    msg: forResend
      ? `A new OTP for ${purpose} has been sent to your email`
      : `OTP for ${purpose} sent to your email`,
  };
}

