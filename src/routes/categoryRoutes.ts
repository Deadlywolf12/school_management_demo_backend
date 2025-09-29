import { Router } from "express";
import { auth } from "../middleware/auth";
import { getCategoryList, syncCategories } from "../controllers/categoryController";
import { validate } from "../middleware/validate";
import { categorySyncSchema } from "../validators/catValidator";



const catRoute = Router();


catRoute.get("/list",auth,getCategoryList);
catRoute.post("/sync",auth,validate(categorySyncSchema),syncCategories);

export default catRoute