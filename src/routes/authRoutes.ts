// routes/auth/authRoutes.ts
import { Router } from "express";
import { auth } from "../middleware/auth";
import { signin, signup, changePassword, changeEmail, toggleUserStatus } from "../controllers/authController";

import { validate } from "../middleware/validate";
import {changeAvatarSchema, changeEmailSchema, changeNameSchema, changePasswordSchema, loginSchema as signinSchema, signupSchema } from "../validators/authValidators";
import { adminAuth } from "../middleware/adminAuth";
import { createUser } from "../controllers/adminController";


const authRouter = Router();


//get user profile
// authRouter.get("/", auth, getProfile);

//signup
authRouter.post("/signup",validate(signupSchema), signup);

// authRouter.post("/request-otp", validate(requestOtpSchema), (req, res) =>
//   reqOtp(req, res,"signup"));
// authRouter.post("/resend-otp",validate(resendOtpSchema), (req, res) =>
//   resendOtp(req, res, "signup"));

//signin
authRouter.post("/signin",validate(signinSchema), signin);

//changePassword
authRouter.put("/changePassword",auth,validate(changePasswordSchema), changePassword);

//forogot pass
// authRouter.post("/forgot/resend-otp",validate(resendOtpSchema), (req, res) =>
//   resendOtp(req, res, "forgotPassword"));
// authRouter.post("/forgot/request-otp", validate(requestOtpSchema),  (req, res) =>
//   reqOtp(req, res, "forgotPassword"));
// authRouter.post("/forgot/reset",validate(forgotPasswordSchema), forgotPassword);

//changeEmail
authRouter.post("/change-email",auth ,validate(changeEmailSchema), changeEmail);
// authRouter.post("/change-email/request-otp",auth, validate(requestOtpSchema),  (req, res) =>
//   reqOtp(req, res, "changeEmail"));
// authRouter.post("/change-email/resend-otp",auth,validate(resendOtpSchema), (req, res) =>
//   resendOtp(req, res, "changeEmail"));
// change name
// authRouter.put("/change-name",auth,validate(changeNameSchema),changeName);
// change avatar
// authRouter.put("/change-avatar",auth,validate(changeAvatarSchema),changeAvatar);

authRouter.patch("/toggle-status/:id", auth, adminAuth, toggleUserStatus);
export default authRouter;
