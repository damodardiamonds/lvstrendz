
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Create a new variant for a product
export async function createVariant(productId: string, formData: FormData) {
  const sku = formData.get("sku") as string;
  const price = formData.get("price")
    ? parseFloat(formData.get("price") as string)
    : null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const attributeValueIds = formData.getAll("attributeValueIds") as string[];

  const variant = await db.variant.create({
    data: {
      productId,
      sku: sku || null,
      price,
      stock,
      isActive: true,
    },
  });

  // Connect attribute values (color, size, etc.)
  if (attributeValueIds.length > 0) {
    await db.variantAttribute.createMany({
      data: attributeValueIds.map((attrValueId) => ({
        variantId: variant.id,
        attributeValueId: attrValueId,
      })),
    });
  }

  revalidatePath(`/admin/products/${productId}/variants`);
}

// Update variant stock and price
export async function updateVariant(
  variantId: string,
  productId: string,
  formData: FormData
) {
  const sku = formData.get("sku") as string;
  const price = formData.get("price")
    ? parseFloat(formData.get("price") as string)
    : null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const isActive = formData.get("isActive") === "true";

  await db.variant.update({
    where: { id: variantId },
    data: {
      sku: sku || null,
      price,
      stock,
      isActive,
    },
  });

  revalidatePath(`/admin/products/${productId}/variants`);
}

// Delete a variant
export async function deleteVariant(variantId: string, productId: string) {
  await db.variant.delete({
    where: { id: variantId },
  });

  revalidatePath(`/admin/products/${productId}/variants`);
}

// Bulk update stock
export async function bulkUpdateStock(
  productId: string,
  updates: { variantId: string; stock: number }[]
) {
  await Promise.all(
    updates.map((update) =>
      db.variant.update({
        where: { id: update.variantId },
        data: { stock: update.stock },
      })
    )
  );

  revalidatePath(`/admin/products/${productId}/variants`);
}

