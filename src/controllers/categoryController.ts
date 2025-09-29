
import { eq ,and } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema/category";
import { AuthRequest } from "../middleware/auth";
import { Request, Response } from "express";
import { CategorySyncBody } from "../validators/catValidator";




export const getCategoryList = async (req:AuthRequest,res:Response)=>{

    try {
        
        if(!req.user) return res.status(401).json({success:false,msg:"Unauthorized"});

        const userCategories = await db.select().from(categories).where(eq(categories.userId,req.user.id));
        return res.json({ success: true, msg:"user categories retrived successfuly" ,categories: userCategories });


    } catch (err) {
        console.error("getCategories error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
        
    }
}


export const syncCategories = async (req: AuthRequest, res: Response) => {
  try {
 
      if(!req.user) return res.status(401).json({success:false,msg:"Unauthorized"});

    const { categories: incomingCategories } = req.body as CategorySyncBody;
    const userId = req.user?.id;



    for (const cat of incomingCategories) {
      if (cat.isDeleted) {
       
        await db.delete(categories).where(and(eq(categories.id, cat.catId),eq(categories.userId,userId)));
        continue;
      }

    
      const updated = await db
        .update(categories)
        .set({
          name: cat.catName,
          type: cat.catType,
        
           updatedAt: new Date(),
        })
        .where(and(eq(categories.id, cat.catId),eq(categories.userId,userId)))
        .returning();

      if (updated.length === 0) {
    
        await db.insert(categories).values({
          id: cat.catId,
          userId,
          name: cat.catName,
          type: cat.catType,
          createdAt: new Date(cat.createdAt),
           updatedAt: new Date(),
        });
      }
    }

    return res.json({ success: true, msg: "Categories synced successfully" });
  } catch (err) {
    console.error("syncCategories error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};