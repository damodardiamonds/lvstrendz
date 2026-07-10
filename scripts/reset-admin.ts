import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function main() {
  const newPassword = "Admin@123"; // Set whatever you want
  const hashed = await hashPassword(newPassword);

  await db.user.update({
    where: { email: "damodar@lvstrendz.com" },
    data: { passwordHash: hashed },
  });

  console.log("✅ Password reset to: Admin@123");
}

main().catch(console.error);
