import express from "express";
import authRouter from "./routes/authRoutes";
import catRoute from "./routes/categoryRoutes";


const app = express();

app.use(express.json());
app.use("/auth",authRouter);
app.use("/categories",catRoute);

app.get("/",(req,res)=>{
    res.send("this is the backend of khata-book432")


});

app.listen(8000,()=>{

    console.log("Started listening to port 8000");
});