
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "damodar@lvstrendz.com"; // Change to your email
  const password = "Admin@123"; // Change to your password
  const name = "Damodar";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("✅ Admin user created!");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

