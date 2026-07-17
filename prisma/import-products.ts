
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Simple CSV parser that handles quoted fields
function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Color hex codes for swatches
const colorCodes: Record<string, string> = {
  Beige: "#F5F5DC",
  Black: "#000000",
  Blue: "#0000FF",
  Chikoo: "#CD853F",
  "Dark Green": "#006400",
  Dustypink: "#D4A5A5",
  Green: "#008000",
  "Light Grey": "#D3D3D3",
  Liril: "#7CFC00",
  Maroon: "#800000",
  Mauve: "#E0B0FF",
  "Off White": "#FAF9F6",
  "Onion Pink": "#C74375",
  Orange: "#FFA500",
  Pink: "#FFC0CB",
  Pista: "#93C572",
  Purple: "#800080",
  Red: "#FF0000",
  Rust: "#B7410E",
  Seagreen: "#2E8B57",
  "Sky Blue": "#87CEEB",
  Teal: "#008080",
  White: "#FFFFFF",
};

async function main() {
  console.log("🚀 Starting product import...\n");

  console.log("🧹 Clearing existing product-related data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.attributeValue.deleteMany();
  console.log("🧹 Cleared successfully!\n");

  // Read CSV
  const csvPath = path.join(__dirname, "products.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`📄 Found ${rows.length} rows in CSV`);

  // Separate parents and variations
  const parents = rows.filter((r) => r["Type"] === "variable");
  const variations = rows.filter((r) => r["Type"] === "variation");

  console.log(`📦 ${parents.length} parent products`);
  console.log(`🔀 ${variations.length} variations\n`);

  // Step 1: Create Categories
  console.log("--- Creating Categories ---");
  const allCategories = new Set<string>();
  parents.forEach((p) => {
    if (p["Categories"]) {
      p["Categories"].split(",").forEach((c) => allCategories.add(c.trim()));
    }
  });

  const categoryMap: Record<string, string> = {};
  for (const catName of allCategories) {
    const slug = slugify(catName);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: catName, slug },
    });
    categoryMap[catName] = category.id;
    console.log(`  ✅ ${catName}`);
  }

  // Step 2: Create Attribute Values
  console.log("\n--- Creating Attribute Values ---");

  // Get the Color and Size attributes (created in seed)
  const colorAttr = await prisma.attribute.findUnique({ where: { slug: "color" } });
  const sizeAttr = await prisma.attribute.findUnique({ where: { slug: "size" } });

  if (!colorAttr || !sizeAttr) {
    throw new Error("Color and Size attributes not found. Run prisma db seed first!");
  }

  // Collect all colors
  const allColors = new Set<string>();
  rows.forEach((r) => {
    if (r["Attribute 1 name"] === "Color" && r["Attribute 1 value(s)"]) {
      r["Attribute 1 value(s)"].split(",").forEach((c) => allColors.add(c.trim()));
    }
    if (r["Attribute 2 name"] === "Color" && r["Attribute 2 value(s)"]) {
      r["Attribute 2 value(s)"].split(",").forEach((c) => allColors.add(c.trim()));
    }
  });

  const colorValueMap: Record<string, string> = {};
  for (const color of allColors) {
    if (!color) continue;
    const slug = slugify(color);
    const value = await prisma.attributeValue.upsert({
      where: { attributeId_slug: { attributeId: colorAttr.id, slug } },
      update: {},
      create: {
        attributeId: colorAttr.id,
        value: color,
        slug,
        colorCode: colorCodes[color] || null,
      },
    });
    colorValueMap[color] = value.id;
  }
  console.log(`  ✅ ${allColors.size} colors created`);

  // Create size values
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "CS"];
  const sizeValueMap: Record<string, string> = {};
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const slug = slugify(size);
    const value = await prisma.attributeValue.upsert({
      where: { attributeId_slug: { attributeId: sizeAttr.id, slug } },
      update: {},
      create: {
        attributeId: sizeAttr.id,
        value: size,
        slug,
        sortOrder: i,
      },
    });
    sizeValueMap[size] = value.id;
  }
  console.log(`  ✅ ${sizes.length} sizes created`);

  // Step 3: Create Products
  console.log("\n--- Creating Products ---");

  for (const parent of parents) {
    const sku = parent["SKU"];
    const name = parent["Name"];
    const slug = slugify(name);
    const description = parent["Description"] || null;
    const shortDescription = parent["Short description"] || null;
    const isFeatured = parent["Is featured?"] === "1";

    // Get price from first variation
    const firstVariation = variations.find((v) => v["Parent"] === sku);
    const regularPrice = firstVariation
      ? parseFloat(firstVariation["Regular price"]) || 0
      : 0;
    const salePrice = firstVariation
      ? parseFloat(firstVariation["Sale price"]) || null
      : null;

    // Create product
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        sku,
        description,
        shortDescription,
        price: salePrice || regularPrice,
        compareAtPrice: salePrice ? regularPrice : null,
        isFeatured,
        isActive: parent["Published"] === "1",
        stock: 100,
      },
    });

    // Link categories
    if (parent["Categories"]) {
      const cats = parent["Categories"].split(",").map((c) => c.trim());
      for (const catName of cats) {
        if (categoryMap[catName]) {
          await prisma.productCategory.upsert({
            where: {
              productId_categoryId: {
                productId: product.id,
                categoryId: categoryMap[catName],
              },
            },
            update: {},
            create: {
              productId: product.id,
              categoryId: categoryMap[catName],
            },
          });
        }
      }
    }

    // Add images
    if (parent["Images"]) {
      const images = parent["Images"].split(",").map((i) => i.trim());
      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: images[i],
            alt: name,
            sortOrder: i,
          },
        });
      }
    }

    // Create variants from variations
    const productVariations = variations.filter((v) => v["Parent"] === sku);

    for (const variation of productVariations) {
      const varPrice = parseFloat(variation["Sale price"]) || parseFloat(variation["Regular price"]) || regularPrice;
      const varSku = variation["SKU"] || null;

      // Determine color for this variation
      let varColor: string | null = null;
      if (variation["Attribute 1 name"] === "Color" && variation["Attribute 1 value(s)"]) {
        varColor = variation["Attribute 1 value(s)"].trim();
      } else if (variation["Attribute 2 name"] === "Color" && variation["Attribute 2 value(s)"]) {
        varColor = variation["Attribute 2 value(s)"].trim();
      }

      // Determine size for this variation
      let varSize: string | null = null;
      if (variation["Attribute 1 name"] === "Size" && variation["Attribute 1 value(s)"]) {
        varSize = variation["Attribute 1 value(s)"].trim();
      } else if (variation["Attribute 2 name"] === "Size" && variation["Attribute 2 value(s)"]) {
        varSize = variation["Attribute 2 value(s)"].trim();
      }

      // Create variant
      const variant = await prisma.variant.create({
        data: {
          productId: product.id,
          sku: varSku,
          price: varPrice,
          stock: 50,
          isActive: true,
        },
      });

      // Link color attribute
      if (varColor && colorValueMap[varColor]) {
        await prisma.variantAttribute.create({
          data: {
            variantId: variant.id,
            attributeValueId: colorValueMap[varColor],
          },
        });
      }

      // Link size attribute
      if (varSize && sizeValueMap[varSize]) {
        await prisma.variantAttribute.create({
          data: {
            variantId: variant.id,
            attributeValueId: sizeValueMap[varSize],
          },
        });
      }
    }

    console.log(`  ✅ ${name.substring(0, 60)}... (${productVariations.length} variants)`);
  }

  // Final stats
  const productCount = await prisma.product.count();
  const variantCount = await prisma.variant.count();
  const categoryCount = await prisma.category.count();
  const imageCount = await prisma.productImage.count();

  console.log("\n========================================");
  console.log("🎉 IMPORT COMPLETE!");
  console.log("========================================");
  console.log(`  Products:   ${productCount}`);
  console.log(`  Variants:   ${variantCount}`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Images:     ${imageCount}`);
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

