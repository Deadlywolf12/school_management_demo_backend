
import { Router,Request,Response } from "express";
import { db } from "../../db";
import { NewUser, users } from "../../db/schema/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const authRouter = Router();

interface SignupBody{
    name: string;
    email:string;
    password:string;
}


authRouter.get("/",(req,res)=>{
    res.send("this is authRoute")


});

authRouter.post("/signup",async (req: Request<{},{},SignupBody>,res: Response)=>{

try {
//getting body from req
   const {email,password}= req.body;

   // checking if user already exist or not

   const existingUser = await db.select().from(users).where(eq(users.email ,email));

   if(existingUser.length){
    //return if user wit hsame email already exist
    res.status(400).json({msg:"User with same email already exists!"});
    return;

   }

   //hashing password

   const hashedPassword = await bcrypt.hash(password,8);
   const newUser: NewUser = {
 
    email,
    password: hashedPassword,


   }

 const [user] =  await db.insert(users).values(newUser).returning();
 res.status(201).json(user);





    
} catch (e) {
    res.status(500).json({error: e});
    
}

})

authRouter.get("/",(req,res)=>{
    res.send("this is auth route")
});


export default authRouter;