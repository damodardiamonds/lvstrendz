
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

  // Create Default Gift Card Offers
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const defaultOffers = [
    {
      id: "offer-starter-1000",
      name: "Starter Trendz Gift Card",
      faceValue: 1000,
      sellingPrice: 1000,
      description: "Enjoy ₹1,000 credit across all luxury collections.",
    },
    {
      id: "offer-[#A0463E]-2500",
      name: "Silver Festive Gift Card",
      faceValue: 2500,
      sellingPrice: 2200,
      description: "Pay ₹2,200 and get ₹2,500 shopping value (Save ₹300).",
    },
    {
      id: "offer-gold-5000",
      name: "Gold Luxury Gift Card",
      faceValue: 5000,
      sellingPrice: 4250,
      description: "Pay ₹4,250 and get ₹5,000 shopping value (Save ₹750).",
    },
    {
      id: "offer-platinum-10000",
      name: "Platinum VIP Gift Card",
      faceValue: 10000,
      sellingPrice: 8000,
      description: "Pay ₹8,000 and get ₹10,000 shopping value (Save ₹2,000).",
    },
  ];

  for (const offer of defaultOffers) {
    await prisma.giftCardOffer.upsert({
      where: { id: offer.id },
      update: {
        isActive: true,
        startDate: now,
        endDate: oneYearLater,
      },
      create: {
        id: offer.id,
        name: offer.name,
        faceValue: offer.faceValue,
        sellingPrice: offer.sellingPrice,
        description: offer.description,
        isActive: true,
        startDate: now,
        endDate: oneYearLater,
        perUserLimit: 5,
        maxPurchases: 1000,
      },
    });
  }

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

