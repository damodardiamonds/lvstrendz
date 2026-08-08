import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function cleanDescriptionText(str: string | null | undefined): string | null {
  if (!str) return null;

  let cleaned = str;

  // 1. Remove data-path-to-node attributes from copy-pasting
  cleaned = cleaned.replace(/\s*data-path-to-node="[^"]*"/gi, '');

  // 2. Replace literal '\n' characters (backslash + n) with actual newline \n
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\r/g, '');

  // 3. Remove empty <p></p> or <p>  </p>
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');

  // 4. Remove empty <p>\n</p> or <p>\r\n</p>
  cleaned = cleaned.replace(/<p>\s*[\r\n]+\s*<\/p>/gi, '');

  // 5. Trim trailing whitespace on each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // 6. Collapse 3+ newlines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim() || null;
}

async function main() {
  try {
    const products = await prisma.product.findMany();

    console.log(`Checking ${products.length} products for cleanup...`);

    let updatedCount = 0;

    for (const p of products) {
      const newDesc = cleanDescriptionText(p.description);
      const newShortDesc = cleanDescriptionText(p.shortDescription);

      const descChanged = newDesc !== p.description;
      const shortDescChanged = newShortDesc !== p.shortDescription;

      if (descChanged || shortDescChanged) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            description: newDesc,
            shortDescription: newShortDesc,
          },
        });
        updatedCount++;
        console.log(`✅ Cleaned product: ${p.name} (${p.slug})`);
      }
    }

    console.log(`\n🎉 Successfully cleaned ${updatedCount} / ${products.length} product descriptions in the database!`);
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
