import { Router } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getTransactions, syncTransactionData } from "../controllers/transactionController";
import { transactionSyncSchema } from "../validators/transactionValidator";

const transactionRoute = Router();


transactionRoute.get("/list",auth,getTransactions);
transactionRoute.post("/sync",auth,validate(transactionSyncSchema),syncTransactionData);

export default transactionRoute;