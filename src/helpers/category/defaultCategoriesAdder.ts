
import { eq } from "drizzle-orm";
import { categories } from "../../db/schema/category";
import { db } from "../../db";

export const createDefaultCategoriesForUser = async (userId: string) => {
  const defaultCategories: { name: string; type: "income" | "expense" }[] = [
    { name: "Food", type: "expense" },
    { name: "Transport", type: "expense" },
    { name: "Rent", type: "expense" },
    { name: "Entertainment", type: "expense" },
    { name: "Salary", type: "income" },
    { name: "Freelance", type: "income" },
    { name: "Investments", type: "income" },
  ];


  const existingCategories = await db
    .select({ name: categories.name, type: categories.type })
    .from(categories)
    .where(eq(categories.userId, userId));

  const existingSet = new Set(
    existingCategories.map((c) => `${c.name.toLowerCase()}-${c.type}`)
  );


  const toInsert = defaultCategories.filter(
    (c) => !existingSet.has(`${c.name.toLowerCase()}-${c.type}`)
  );

  if (toInsert.length > 0) {
    await db.insert(categories).values(
      toInsert.map((c) => ({
        userId,
        name: c.name,
        type: c.type,
      }))
    );
  }
};
