import { db } from "../../db";
import { otps } from "../../db/schema/otps";
import { desc, eq } from "drizzle-orm";

 
 export async function checkOtpCoolDown(email:string,cooldownSeconds:number){

     const [latestOtp] = await db
    .select()
    .from(otps)
    .where(eq(otps.email, email))
    .orderBy(desc(otps.expiresAt)) 
    .limit(1);

      if (!latestOtp) return null;

   
  const now = new Date();
  const lastOtpTime = new Date(latestOtp.expiresAt.getTime() - 15 * 60 * 1000); 
  

  const diffSeconds = (now.getTime() - lastOtpTime.getTime()) / 1000;

  if (diffSeconds < cooldownSeconds) {
    return cooldownSeconds - Math.floor(diffSeconds);
  }

  return null; 



 }
 
