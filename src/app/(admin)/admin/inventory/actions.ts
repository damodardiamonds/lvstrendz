"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface StockItemInput {
  variantId?: string;
  colorId?: string | null;
  sizeId?: string | null;
  stock: number;
}

export async function updateProductStockMatrix(
  productId: string,
  stockItems: StockItemInput[]
) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { price: true, slug: true },
    });

    if (!product) {
      return { error: "Product not found." };
    }

    // Get existing variants for this product
    const existingVariants = await db.variant.findMany({
      where: { productId },
      include: {
        attributes: {
          select: { attributeValueId: true },
        },
      },
    });

    for (const item of stockItems) {
      const targetStock = Math.max(0, Math.floor(Number(item.stock) || 0));

      let targetVariant = item.variantId
        ? existingVariants.find((v) => v.id === item.variantId)
        : undefined;

      if (!targetVariant && (item.colorId || item.sizeId)) {
        // Look up by attribute IDs
        targetVariant = existingVariants.find((v) => {
          const vAttrIds = v.attributes.map((a) => a.attributeValueId);
          const hasColor = !item.colorId || vAttrIds.includes(item.colorId);
          const hasSize = !item.sizeId || vAttrIds.includes(item.sizeId);
          return hasColor && hasSize;
        });
      }

      if (targetVariant) {
        // Update existing variant stock
        await db.variant.update({
          where: { id: targetVariant.id },
          data: { stock: targetStock },
        });
      } else if (item.colorId || item.sizeId) {
        // Create new variant record for this color/size combination
        const attrValueIds = [item.colorId, item.sizeId].filter(Boolean) as string[];

        await db.variant.create({
          data: {
            productId,
            stock: targetStock,
            price: product.price,
            attributes: {
              create: attrValueIds.map((attributeValueId) => ({
                attributeValueId,
              })),
            },
          },
        });
      }
    }

    // Re-calculate aggregate total stock for product
    const totalStockAgg = await db.variant.aggregate({
      where: { productId },
      _sum: { stock: true },
    });

    const newTotalStock = totalStockAgg._sum.stock ?? 0;

    await db.product.update({
      where: { id: productId },
      data: { stock: newTotalStock },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    revalidatePath("/");
    if (product.slug) {
      revalidatePath(`/product/${product.slug}`);
    }

    return {
      success: true,
      totalStock: newTotalStock,
      message: "Stock updated successfully!",
    };
  } catch (err: any) {
    console.error("Failed to update inventory stock matrix:", err);
    return {
      error: err?.message || "An unexpected error occurred while updating stock.",
    };
  }
}

export async function updateSimpleProductStock(
  productId: string,
  stock: number
) {
  try {
    const targetStock = Math.max(0, Math.floor(Number(stock) || 0));

    const product = await db.product.update({
      where: { id: productId },
      data: { stock: targetStock },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    revalidatePath("/");
    if (product.slug) {
      revalidatePath(`/product/${product.slug}`);
    }

    return {
      success: true,
      stock: targetStock,
      message: "Stock updated successfully!",
    };
  } catch (err: any) {
    console.error("Failed to update simple product stock:", err);
    return {
      error: err?.message || "Failed to update stock.",
    };
  }
}
