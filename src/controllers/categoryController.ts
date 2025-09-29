
import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema/category";
import { AuthRequest } from "../middleware/auth";
import { Request, Response } from "express";
import { Timestamp } from "mongodb";

export interface CreateCatBody {
  catId: string; 
  catName: string; 
  catType: "income" | "expense"; 
  createdAt: string; 
  updatedAt: string;
  isDeleted?: boolean; 
}


export const getCategoryList = async (req:AuthRequest,res:Response)=>{

    try {
        
        if(!req.user) return res.status(401).json({success:false,msg:"Unauthorized"});

        const userCategories = await db.select().from(categories).where(eq(categories.id,req.user.id));
        return res.json({ success: true, categories: userCategories });


    } catch (err) {
        console.error("getCategories error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
        
    }
}

export const createCategory = async (req)