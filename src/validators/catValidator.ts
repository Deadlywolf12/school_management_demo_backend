import { z } from "zod";

export const categorySyncSchema = z.object({
  categories: z.array(
    z.object({
      catId: z.string().uuid({ message: "Invalid UUID" }),
      catName: z.string().min(2,"Category name must be at least 2 characters"),
      catType: z.enum(["income", "expense"]),
      createdAt: z.string().datetime("Invalid date format"),
      updatedAt: z.string().datetime("Invalid date format"),
      isDeleted: z.boolean().optional().default(false),
    })
  ),
});

export type CategorySyncBody = z.infer<typeof categorySyncSchema>;
