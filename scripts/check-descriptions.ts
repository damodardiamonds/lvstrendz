import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
      },
    });

    console.log(`Total products: ${products.length}`);

    let countWithLiteralSlashN = 0;
    products.forEach((p) => {
      const hasInDesc = p.description && p.description.includes('\\n');
      const hasInShort = p.shortDescription && p.shortDescription.includes('\\n');
      if (hasInDesc || hasInShort) {
        countWithLiteralSlashN++;
        console.log(`\nProduct ID: ${p.id} | Slug: ${p.slug} | Name: ${p.name}`);
        console.log('Sample Description snippet:');
        console.log(JSON.stringify(p.description?.substring(0, 300)));
      }
    });

    console.log(`\nProducts with literal '\\n': ${countWithLiteralSlashN} / ${products.length}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
