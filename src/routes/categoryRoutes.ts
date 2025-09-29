import { Router } from "express";
import { auth } from "../middleware/auth";
import { getCategoryList } from "../controllers/categoryController";
import { validate } from "../middleware/validate";
import { categorySyncSchema } from "../validators/catValidator";



const catRoute = Router();


catRoute.get("/list",auth,getCategoryList);
catRoute.get("/sync",auth,validate(categorySyncSchema),getCategoryList);

export default catRoute