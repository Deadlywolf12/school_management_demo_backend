// routes/auth/authRoutes.ts
import { Router } from "express";
import { auth } from "../../middleware/auth";
import { getProfile, reqOtp, signin, signup, resendOtp } from "../../controllers/authController";
import { validate } from "../../middleware/validate";
import { requestOtpSchema, resendOtpSchema, loginSchema as signinSchema, signupSchema } from "../../validators/auth/authValidators";


const authRouter = Router();

authRouter.get("/", auth, getProfile);
authRouter.post("/request-otp", validate(requestOtpSchema), reqOtp);
authRouter.post("/signup",validate(signupSchema), signup);
authRouter.post("/resend-otp",validate(resendOtpSchema), resendOtp);
authRouter.post("/signin",validate(signinSchema), signin);

export default authRouter;
