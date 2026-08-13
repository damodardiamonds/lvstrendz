import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Product Size Update Script...");

  // 1. Ensure 'size' attribute exists
  let sizeAttr = await prisma.attribute.findUnique({
    where: { slug: "size" },
  });

  if (!sizeAttr) {
    sizeAttr = await prisma.attribute.create({
      data: {
        name: "Size",
        slug: "size",
      },
    });
    console.log("  Created 'Size' attribute.");
  }

  // 2. Define standard sizes
  const standardSizes = [
    { value: "XS", slug: "xs", sortOrder: 0 },
    { value: "S", slug: "s", sortOrder: 1 },
    { value: "M", slug: "m", sortOrder: 2 },
    { value: "L", slug: "l", sortOrder: 3 },
    { value: "XL", slug: "xl", sortOrder: 4 },
    { value: "XXL", slug: "xxl", sortOrder: 5 },
  ];

  const standardSizeIds: string[] = [];

  for (const s of standardSizes) {
    const val = await prisma.attributeValue.upsert({
      where: {
        attributeId_slug: {
          attributeId: sizeAttr.id,
          slug: s.slug,
        },
      },
      update: {
        value: s.value,
        sortOrder: s.sortOrder,
      },
      create: {
        attributeId: sizeAttr.id,
        value: s.value,
        slug: s.slug,
        sortOrder: s.sortOrder,
      },
    });
    standardSizeIds.push(val.id);
  }

  console.log(`  ✅ Ensured 6 standard sizes exist: XS, S, M, L, XL, XXL (IDs: ${standardSizeIds.join(", ")})`);

  // 3. Find and remove CS / Custom Size attribute values if present
  const csAttrValues = await prisma.attributeValue.findMany({
    where: {
      attributeId: sizeAttr.id,
      OR: [
        { value: { equals: "CS", mode: "insensitive" } },
        { value: { equals: "Custom Size", mode: "insensitive" } },
        { slug: { equals: "cs", mode: "insensitive" } },
        { slug: { equals: "custom-size", mode: "insensitive" } },
      ],
    },
  });

  if (csAttrValues.length > 0) {
    const csIds = csAttrValues.map((v) => v.id);
    console.log(`  Found ${csIds.length} CS attribute value(s) to remove:`, csIds);

    // Delete variant attribute links referencing CS
    await prisma.variantAttribute.deleteMany({
      where: {
        attributeValueId: { in: csIds },
      },
    });

    // Delete CS attribute values
    await prisma.attributeValue.deleteMany({
      where: {
        id: { in: csIds },
      },
    });
    console.log("  ✅ CS attribute values deleted.");
  }

  // 4. Update ALL products to have selectedSizeIds set to all 6 standard sizes
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  console.log(`  Updating ${products.length} products with all standard sizes...`);

  let count = 0;
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        selectedSizeIds: standardSizeIds,
      },
    });
    count++;
  }

  console.log(`  🎉 Successfully updated ${count} products with standard sizes (XS, S, M, L, XL, XXL)!`);
}

main()
  .catch((e) => {
    console.error("❌ Error updating product sizes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
