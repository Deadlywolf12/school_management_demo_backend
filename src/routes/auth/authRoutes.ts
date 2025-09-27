// routes/auth/authRoutes.ts
import { Router } from "express";
import { auth } from "../../middleware/auth";
import { getProfile, reqOtp, signin, signup, resendOtp, changePassword as changePassword, forgotPassword, changeEmail } from "../../controllers/authController";
import { validate } from "../../middleware/validate";
import {changeEmailSchema, changePasswordSchema, forgotPasswordSchema, requestOtpSchema, resendOtpSchema, loginSchema as signinSchema, signupSchema } from "../../validators/auth/authValidators";


const authRouter = Router();


//get user profile
authRouter.get("/", auth, getProfile);

//signup
authRouter.post("/signup",validate(signupSchema), signup);
authRouter.post("/request-otp", validate(requestOtpSchema), (req, res) =>
  reqOtp(req, res,"signup"));
authRouter.post("/resend-otp",validate(resendOtpSchema), (req, res) =>
  resendOtp(req, res, "signup"));

//signin
authRouter.post("/signin",validate(signinSchema), signin);

//changePassword
authRouter.put("/changePassword",auth,validate(changePasswordSchema), changePassword);

//forogot pass
authRouter.post("/forgot/resend-otp",validate(resendOtpSchema), (req, res) =>
  resendOtp(req, res, "forgotPassword"));
authRouter.post("/forgot/request-otp", validate(requestOtpSchema),  (req, res) =>
  reqOtp(req, res, "forgotPassword"));
authRouter.post("/forgot/reset",validate(forgotPasswordSchema), forgotPassword);

//changeEmail
authRouter.post("/change-email/verify",auth ,validate(changeEmailSchema), changeEmail);
authRouter.post("/change-email/request-otp",auth, validate(requestOtpSchema),  (req, res) =>
  reqOtp(req, res, "changeEmail"));
authRouter.post("/change-email/resend-otp",auth,validate(resendOtpSchema), (req, res) =>
  resendOtp(req, res, "changeEmail"));


export default authRouter;
