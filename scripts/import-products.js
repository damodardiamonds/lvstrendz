const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const csvPath = 'C:\\Projects\\lvstrendz\\wc-product-export-9-7-2026-1783583635076.csv';

// Simple CSV parser
function parseCSV(content) {
  const result = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(field);
      result.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    result.push(row);
  }
  return result;
}

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function main() {
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = parseCSV(csvContent);

  if (parsed.length === 0) {
    console.error('CSV is empty');
    return;
  }

  const headers = parsed[0].map(h => h.replace(/^\ufeff/, '').trim()); // Strip BOM
  console.log(`Parsed ${parsed.length - 1} records from CSV.`);

  const getColVal = (row, headerName) => {
    const idx = headers.indexOf(headerName);
    if (idx === -1) return '';
    return (row[idx] || '').trim();
  };

  // Group records by type
  const parentRows = [];
  const variationRows = [];

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (row.length < 2) continue;
    const type = getColVal(row, 'Type');
    if (type === 'variable' || type === 'simple') {
      parentRows.push(row);
    } else if (type === 'variation') {
      variationRows.push(row);
    }
  }

  console.log(`Found ${parentRows.length} parent products and ${variationRows.length} variants.`);

  // 1. Create default attributes (Color & Size)
  const colorAttr = await prisma.attribute.upsert({
    where: { slug: 'color' },
    update: {},
    create: { name: 'Color', slug: 'color' },
  });

  const sizeAttr = await prisma.attribute.upsert({
    where: { slug: 'size' },
    update: {},
    create: { name: 'Size', slug: 'size' },
  });

  const attrMap = {
    color: colorAttr,
    size: sizeAttr,
    Color: colorAttr,
    Size: sizeAttr,
  };

  // 2. Import Parent Products & Categories
  const skuToProductMap = {};

  for (const row of parentRows) {
    const name = getColVal(row, 'Name');
    const sku = getColVal(row, 'SKU') || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const description = getColVal(row, 'Description');
    const shortDescription = getColVal(row, 'Short description');
    const isFeatured = getColVal(row, 'Is featured?') === '1';
    
    // Parse prices
    const regularPriceStr = getColVal(row, 'Regular price');
    const salePriceStr = getColVal(row, 'Sale price');
    
    const regularPrice = regularPriceStr ? parseFloat(regularPriceStr) : 0;
    const salePrice = salePriceStr ? parseFloat(salePriceStr) : null;
    
    const price = salePrice !== null && salePrice < regularPrice ? salePrice : regularPrice;
    const compareAtPrice = salePrice !== null && salePrice < regularPrice ? regularPrice : null;

    const slug = slugify(name);

    // Categories
    const categoriesStr = getColVal(row, 'Categories');
    const categoryNames = categoriesStr ? categoriesStr.split(',').map(c => c.trim()).filter(Boolean) : [];
    const productCategories = [];

    for (const catName of categoryNames) {
      const catSlug = slugify(catName);
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: catName, slug: catSlug },
      });
      productCategories.push(category);
    }

    // Upsert Product
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description,
        shortDescription,
        price,
        compareAtPrice,
        isFeatured,
        sku,
      },
      create: {
        name,
        slug,
        description,
        shortDescription,
        price,
        compareAtPrice,
        isFeatured,
        sku,
      },
    });

    skuToProductMap[sku] = product;

    // Link Categories
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (const cat of productCategories) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: cat.id,
        },
      }).catch(() => {}); // Ignore duplicates
    }

    // Images
    const imagesStr = getColVal(row, 'Images');
    const imageUrls = imagesStr ? imagesStr.split(',').map(url => url.trim()).filter(Boolean) : [];

    await prisma.productImage.deleteMany({ where: { productId: product.id, variantId: null } });
    
    let sortOrder = 0;
    for (const url of imageUrls) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          sortOrder: sortOrder++,
        },
      });
    }

    console.log(`Imported parent product: ${name} (${sku})`);
  }

  // 3. Import Variants
  for (const row of variationRows) {
    const parentSku = getColVal(row, 'Parent');
    const parentProduct = skuToProductMap[parentSku];

    if (!parentProduct) {
      console.warn(`Could not find parent product with SKU: ${parentSku} for variant.`);
      continue;
    }

    const sku = getColVal(row, 'SKU') || `VAR-${parentSku}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const regularPriceStr = getColVal(row, 'Regular price');
    const salePriceStr = getColVal(row, 'Sale price');

    const regularPrice = regularPriceStr ? parseFloat(regularPriceStr) : null;
    const salePrice = salePriceStr ? parseFloat(salePriceStr) : null;
    const price = salePrice !== null && salePrice < regularPrice ? salePrice : (regularPrice || parentProduct.price);

    const stockStr = getColVal(row, 'Stock');
    const stock = stockStr ? parseInt(stockStr, 10) : 10; // Default stock if not specified

    // Find and Upsert Variant
    const variant = await prisma.variant.upsert({
      where: { sku },
      update: {
        price,
        stock,
      },
      create: {
        productId: parentProduct.id,
        sku,
        price,
        stock,
      },
    });

    // Parse attributes
    // Look for Attribute 1 name, Attribute 1 value(s), Attribute 2 name, Attribute 2 value(s)
    const attributes = [];
    for (let i = 1; i <= 4; i++) {
      const name = getColVal(row, `Attribute ${i} name`);
      const val = getColVal(row, `Attribute ${i} value(s)`);
      if (name && val) {
        attributes.push({ name, value: val });
      }
    }

    await prisma.variantAttribute.deleteMany({ where: { variantId: variant.id } });

    for (const attr of attributes) {
      const resolvedAttr = attrMap[attr.name] || attrMap[attr.name.toLowerCase()];
      if (!resolvedAttr) continue;

      const valSlug = slugify(attr.value);

      // Create attribute value
      const attrVal = await prisma.attributeValue.upsert({
        where: {
          attributeId_slug: {
            attributeId: resolvedAttr.id,
            slug: valSlug,
          },
        },
        update: {},
        create: {
          attributeId: resolvedAttr.id,
          value: attr.value,
          slug: valSlug,
        },
      });

      // Link Variant to AttributeValue
      await prisma.variantAttribute.create({
        data: {
          variantId: variant.id,
          attributeValueId: attrVal.id,
        },
      }).catch(() => {});
    }

    // Images for Variant
    const imagesStr = getColVal(row, 'Images');
    const imageUrls = imagesStr ? imagesStr.split(',').map(url => url.trim()).filter(Boolean) : [];

    await prisma.productImage.deleteMany({ where: { variantId: variant.id } });

    let sortOrder = 0;
    for (const url of imageUrls) {
      await prisma.productImage.create({
        data: {
          productId: parentProduct.id,
          variantId: variant.id,
          url,
          sortOrder: sortOrder++,
        },
      });
    }

    console.log(`Imported variant for ${parentProduct.name}: SKU ${sku}`);
  }

  console.log('Calculating and updating parent product prices from their variants...');
  const parents = await prisma.product.findMany({
    include: { variants: true }
  });

  for (const parent of parents) {
    if (parent.variants.length > 0) {
      const activeVariants = parent.variants.filter(v => v.isActive);
      if (activeVariants.length > 0) {
        const minPrice = Math.min(...activeVariants.map(v => parseFloat(v.price.toString())));
        await prisma.product.update({
          where: { id: parent.id },
          data: {
            price: minPrice,
          }
        });
        console.log(`Updated price for parent ${parent.name} to ₹${minPrice}`);
      }
    }
  }

  console.log('✅ Import completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
