import express from "express";
import authRouter from "./routes/authRoutes";
import adminRouter from "./routes/adminRoutes";



const app = express();

app.use(express.json());
app.use("/auth",authRouter);
app.use("/admin",adminRouter);


app.get("/",(req,res)=>{
    res.send("this is the backend of school managment system")


});

app.listen(8000,()=>{

    console.log("Started listening to port 8000");
});