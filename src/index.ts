import express from "express";
import authRouter from "./routes/authRoutes";
import adminRouter from "./routes/adminRoutes";

import attendanceRouter from "./routes/attendanceRoutes";
import subjectRouter from "./routes/subjectRoutes";
import feeRouter from "./routes/feeRoutes";
import gradeRouter from "./routes/gradingRoutes";
import classRouter from "./routes/classesRoutes";
import salaryRouter from "./routes/salaryroutes";



const app = express();

app.use(express.json());
app.use("/api/v1/auth",authRouter);
app.use("/api/v1/admin",adminRouter);
// app.use("/api/v1/admin/teacher",teacherRouter);
app.use("/api/v1/attendance",attendanceRouter);
app.use("/api/v1",subjectRouter);
app.use("/api/v1/payments",feeRouter);
app.use("/api/v1/grades",gradeRouter);
app.use("/api/v1/classes",classRouter);
app.use("/api/v1/salary",salaryRouter);


app.get("/",(req,res)=>{
    res.send("this is the backend of school managment system")


});

app.listen(8000,()=>{

    console.log("Started listening to port 8000");
});