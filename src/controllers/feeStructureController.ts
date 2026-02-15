import { Request, Response } from "express";
import { db } from "../db";

import { desc } from "drizzle-orm";
import { feeStructures } from "../db/schema/fee";

export const getAllFeeStructures = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await db
      .select()
      .from(feeStructures)
      .orderBy(desc(feeStructures.createdAt));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee structures",
    });
  }
};
