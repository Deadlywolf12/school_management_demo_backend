import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema/users";
import { eq } from "drizzle-orm";
async function seedAdmin() {
  const email = "admin@school.com";
  const name = "System Admin";
  const password = "admin123"; // password you want
  const role = "admin";

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 8);

  // Check if admin already exists
  const [existing] = await db
  .select()
  .from(users)
  .where(eq(users.email, email));
  if (!existing) {
    await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role,
    });
    console.log("✅ Admin user created!");
  } else {
    console.log("ℹ️ Admin already exists.");
  }

  process.exit(0);
}

seedAdmin();
