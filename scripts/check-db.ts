import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const variantsCount = await prisma.variant.count();
    const attributesCount = await prisma.attribute.count();
    const siteSettingsCount = await prisma.siteSetting.count();
    const couponsCount = await prisma.coupon.count();

    console.log("Database Stats:");
    console.log(`- Products: ${productsCount}`);
    console.log(`- Categories: ${categoriesCount}`);
    console.log(`- Variants: ${variantsCount}`);
    console.log(`- Attributes: ${attributesCount}`);
    console.log(`- Site Settings: ${siteSettingsCount}`);
    console.log(`- Coupons: ${couponsCount}`);

    if (productsCount > 0) {
      console.log("\nSample Products:");
      const samples = await prisma.product.findMany({ take: 3, include: { images: true } });
      samples.forEach(p => {
        console.log(`- [${p.sku}] ${p.name} - Price: ${p.price} - Images: ${p.images.length}`);
      });
    }
  } catch (err) {
    console.error("DB Query Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
