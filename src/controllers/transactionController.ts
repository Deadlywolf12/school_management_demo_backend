import { eq , and } from "drizzle-orm";
import { db } from "../db";
import { transactions } from "../db/schema/transactions";
import { AuthRequest } from "../middleware/auth";
import { Request, Response } from "express";
import { TransactionSyncInput } from "../validators/transactionValidator";




export const getTransactions = async (req:AuthRequest,res:Response)=>{

    try {
        
        if(!req.user) return res.status(401).json({success:false,msg:"Unauthorized"});

        const userTransactions = await db.select().from(transactions).where(eq(transactions.userId,req.user.id));
        return res.json({ success: true,msg:"user transactions retrived successfuly" ,transactions: userTransactions });


    } catch (err) {
        console.error("getCategories error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
        
    }
}


export const syncTransactionData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Unauthorized"});
    }

    const { transactions: incomingTransactions } = req.body as TransactionSyncInput;
    const userId = req.user.id;

    for (const txn of incomingTransactions) {
      if (txn.isDeleted) {
        await db
          .delete(transactions)
          .where(and(eq(transactions.id, txn.id),eq(transactions.userId, userId)))
      
        continue;
      }

await db
  .insert(transactions)
  .values({
    id: txn.id,
    userId,
    categoryId: txn.categoryId,
    type: txn.type,
    amount: txn.amount,
    note: txn.note,
    date: txn.date,
    createdAt: txn.createdAt,
    updatedAt: txn.updatedAt,
  })
  .onConflictDoUpdate({
    target: transactions.id,
    set: {
      categoryId: txn.categoryId,
      type: txn.type,
      amount: txn.amount,
      note: txn.note,
      date: txn.date,
      updatedAt: txn.updatedAt,
    },
  });
    }

    return res.status(200).json({ success: true, msg: "Transactions synced successfully" });
  } catch (err) {
    console.error("syncTransactions error:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
