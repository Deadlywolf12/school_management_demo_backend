import { Router } from "express";

const authRouter = Router();

authRouter.get("/",(req,res)=>{
    res.send("this is auth route")
});