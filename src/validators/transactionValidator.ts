import { z } from "zod";

export const transactionSyncSchema = z.object({
  transactions: z.array(
    z.object({
      id: z.string().uuid("Invalid UUID"),
      categoryId: z.string().uuid("Invalid UUID"),
      type: z.enum(["income", "expense"]),
      amount: z.number().positive("amount should be positive"),
      note: z.string().max(255,"max 100 characters allowed").optional(),
      date: z.coerce.date(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      isDeleted: z.boolean().default(false),
    })
  ),
});
export type TransactionSyncInput = z.infer<typeof transactionSyncSchema>;
export type TransactionItem = TransactionSyncInput["transactions"][number];