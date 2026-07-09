
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create FLAT20 coupon
  await prisma.coupon.upsert({
    where: { code: "FLAT20" },
    update: {},
    create: {
      code: "FLAT20",
      type: "PERCENTAGE",
      value: 20,
      isActive: true,
    },
  });

  // Create attributes: Color and Size
  await prisma.attribute.upsert({
    where: { slug: "color" },
    update: {},
    create: {
      name: "Color",
      slug: "color",
    },
  });

  await prisma.attribute.upsert({
    where: { slug: "size" },
    update: {},
    create: {
      name: "Size",
      slug: "size",
    },
  });

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

