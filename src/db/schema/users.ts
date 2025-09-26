import { text, timestamp, uuid, pgTable} from "drizzle-orm/pg-core";


export const users = pgTable("users",{
    id: uuid("id").primaryKey().defaultRandom(),

    email: text("email").notNull().unique(),
    avatar: text("avatar"), 
    name: text("name").notNull(),
    
    password: text("password").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow()
    
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;