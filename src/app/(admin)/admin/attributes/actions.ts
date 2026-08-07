"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Ensure attribute (Color / Size) exists
export async function getOrCreateAttribute(name: string, slug: string) {
  let attr = await db.attribute.findUnique({ where: { slug } });
  if (!attr) {
    attr = await db.attribute.create({
      data: { name, slug },
    });
  }
  return attr;
}

// Add a color attribute value with hex code
export async function addColorValue(name: string, colorCode: string) {
  const value = name.trim();
  if (!value) throw new Error("Color name is required");

  const colorAttr = await getOrCreateAttribute("Color", "color");
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const code = colorCode ? colorCode.trim() : "#000000";

  const existing = await db.attributeValue.findFirst({
    where: { attributeId: colorAttr.id, slug },
  });

  if (existing) {
    await db.attributeValue.update({
      where: { id: existing.id },
      data: { value, colorCode: code },
    });
  } else {
    await db.attributeValue.create({
      data: {
        attributeId: colorAttr.id,
        value,
        slug,
        colorCode: code,
      },
    });
  }

  revalidatePath("/admin/attributes");
  revalidatePath("/admin/products");
}

// Add a size attribute value
export async function addSizeValue(name: string) {
  const value = name.trim();
  if (!value) throw new Error("Size name is required");

  const sizeAttr = await getOrCreateAttribute("Size", "size");
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = await db.attributeValue.findFirst({
    where: { attributeId: sizeAttr.id, slug },
  });

  if (!existing) {
    await db.attributeValue.create({
      data: {
        attributeId: sizeAttr.id,
        value,
        slug,
      },
    });
  }

  revalidatePath("/admin/attributes");
  revalidatePath("/admin/products");
}

// Update attribute value
export async function updateAttributeValue(id: string, value: string, colorCode?: string | null) {
  const valTrimmed = value.trim();
  if (!valTrimmed) throw new Error("Attribute value cannot be empty");

  const slug = valTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await db.attributeValue.update({
    where: { id },
    data: {
      value: valTrimmed,
      slug,
      ...(colorCode !== undefined ? { colorCode } : {}),
    },
  });

  revalidatePath("/admin/attributes");
  revalidatePath("/admin/products");
}

// Delete attribute value
export async function deleteAttributeValue(id: string) {
  await db.attributeValue.delete({
    where: { id },
  });

  revalidatePath("/admin/attributes");
  revalidatePath("/admin/products");
}
