import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function sendOtpEmail(to: string, otp: string, expiresInMinutes: number) {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

 
  const { subject, text, html } = generateOtpEmailTemplate(to, otp, expiresInMinutes);

  await transporter.sendMail({
    from: `"KhataBook" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export function generateOtpEmailTemplate(email: string, otp: string, expiresInMinutes: number) {
  return {
    subject: "Your OTP Code - Secure Verification",
    text: `Hello there,

Welcome to our platform! 🎉

Your One-Time Password (OTP) is: ${otp}

⚠️ Please do not share this code with anyone.
This OTP will expire in ${expiresInMinutes} minutes.

We’re sending this to your email: ${email}
If you did not request this, please ignore the message.

Thanks,  
The Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome to our platform 🎉</h2>
        <p>Hello there,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <h3 style="color: #2e6c80;">${otp}</h3>
        <p><b>⚠️ Do not share this code with anyone.</b></p>
        <p>This OTP will expire in <b>${expiresInMinutes} minutes</b>.</p>
        <p>We’re sending this to your email: <b>${email}</b></p>
        <p>If you did not request this, simply ignore this email.</p>
        <br/>
        <p>Thanks,<br/>The Team</p>
      </div>
    `,
  };
}
