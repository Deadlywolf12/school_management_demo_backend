import express from "express";
import authRouter from "./routes/authRoutes";
import adminRouter from "./routes/adminRoutes";

import attendanceRouter from "./routes/attendanceRoutes";



const app = express();

app.use(express.json());
app.use("/api/v1/auth",authRouter);
app.use("/api/v1/admin",adminRouter);
// app.use("/api/v1/admin/teacher",teacherRouter);
app.use("/api/v1",attendanceRouter);


app.get("/",(req,res)=>{
    res.send("this is the backend of school managment system")


});

app.listen(8000,()=>{

    console.log("Started listening to port 8000");
});