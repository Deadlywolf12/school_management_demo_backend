import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {createUserSchema} from "../validators/adminValidators";
import { createUser } from "../controllers/adminController";

const adminRouter = Router();
adminRouter.post("/createUsers",auth,adminAuth,validate(createUserSchema), createUser);
export default adminRouter;