
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProductImages } from "./[id]/images/actions";

function cleanDescriptionText(str: string | null | undefined): string | null {
  if (!str) return null;
  let cleaned = str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\s*data-path-to-node="[^"]*"/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<p>\s*[\r\n]+\s*<\/p>/gi, "");
  return cleaned.trim() || null;
}

// Create product
export async function createProduct(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const description = cleanDescriptionText(formData.get("description") as string);
    const shortDescription = cleanDescriptionText(formData.get("shortDescription") as string);
    const sku = (formData.get("sku") as string)?.trim();
    const priceRaw = formData.get("price") as string;
    const compareAtPriceRaw = formData.get("compareAtPrice") as string;
    const costPriceRaw = formData.get("costPrice") as string;
    const stockRaw = formData.get("stock") as string;
    const lowStockAlertRaw = formData.get("lowStockAlert") as string;
    const weightRaw = formData.get("weight") as string;
    const metaTitle = (formData.get("metaTitle") as string)?.trim();
    const metaDescription = (formData.get("metaDescription") as string)?.trim();
    const categoryIds = formData.getAll("categoryIds") as string[];
    const displayAttributes = formData.getAll("displayAttributes") as string[];
    const selectedColorIds = formData.getAll("selectedColorIds") as string[];
    const selectedSizeIds = formData.getAll("selectedSizeIds") as string[];

    const isActive = formData.getAll("isActive").includes("true");
    const isFeatured = formData.getAll("isFeatured").includes("true");

    if (!name) {
      return { error: "Product name is required." };
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!finalSlug) {
      return { error: "URL slug is required." };
    }

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
      return { error: "Please enter a valid selling price." };
    }

    const compareAtPrice = compareAtPriceRaw && compareAtPriceRaw.trim() !== ""
      ? parseFloat(compareAtPriceRaw)
      : null;
    if (compareAtPriceRaw && compareAtPriceRaw.trim() !== "" && (isNaN(compareAtPrice!) || compareAtPrice! < 0)) {
      return { error: "Compare at price must be a valid positive number." };
    }

    const costPrice = costPriceRaw && costPriceRaw.trim() !== ""
      ? parseFloat(costPriceRaw)
      : null;
    if (costPriceRaw && costPriceRaw.trim() !== "" && (isNaN(costPrice!) || costPrice! < 0)) {
      return { error: "Cost price must be a valid positive number." };
    }

    const weight = weightRaw && weightRaw.trim() !== ""
      ? parseFloat(weightRaw)
      : null;
    if (weightRaw && weightRaw.trim() !== "" && (isNaN(weight!) || weight! < 0)) {
      return { error: "Weight must be a valid positive number." };
    }

    const stock = parseInt(stockRaw) || 0;
    const lowStockAlert = parseInt(lowStockAlertRaw) || 5;

    // Check slug uniqueness
    const existingSlug = await db.product.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      return { error: `Product with URL slug "${finalSlug}" already exists. Please choose a different slug.` };
    }

    // Check SKU uniqueness
    const finalSku = sku || null;
    if (finalSku) {
      const existingSku = await db.product.findFirst({
        where: { sku: { equals: finalSku, mode: "insensitive" } },
      });
      if (existingSku) {
        return { error: `SKU "${finalSku}" is already assigned to another product.` };
      }
    }

    const newProduct = await db.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        shortDescription: shortDescription || null,
        sku: finalSku,
        price,
        compareAtPrice,
        costPrice,
        stock,
        lowStockAlert,
        isActive,
        isFeatured,
        weight,
        displayAttributes: displayAttributes.length > 0 ? displayAttributes : ["size", "color"],
        selectedColorIds,
        selectedSizeIds,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        categories: {
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      },
    });

    // Process image uploads if present
    const files = formData.getAll("files") as File[];
    if (files && files.length > 0 && files[0] && files[0].size > 0) {
      const uploadRes = await uploadProductImages(newProduct.id, formData);
      if (uploadRes && uploadRes.error) {
        return { error: `Product created, but image upload failed: ${uploadRes.error}` };
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
  } catch (err: any) {
    console.error("Failed to create product:", err);
    return { error: err?.message || "An unexpected database error occurred while creating product." };
  }

  redirect("/admin/products");
}

// Update product
export async function updateProduct(id: string, formData: FormData): Promise<{ error?: string } | void> {
  const existingProduct = await db.product.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existingProduct) {
    return { error: "Product not found." };
  }

  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const description = cleanDescriptionText(formData.get("description") as string);
    const shortDescription = cleanDescriptionText(formData.get("shortDescription") as string);
    const sku = (formData.get("sku") as string)?.trim();
    const priceRaw = formData.get("price") as string;
    const compareAtPriceRaw = formData.get("compareAtPrice") as string;
    const costPriceRaw = formData.get("costPrice") as string;
    const stockRaw = formData.get("stock") as string;
    const lowStockAlertRaw = formData.get("lowStockAlert") as string;
    const weightRaw = formData.get("weight") as string;
    const metaTitle = (formData.get("metaTitle") as string)?.trim();
    const metaDescription = (formData.get("metaDescription") as string)?.trim();
    const categoryIds = formData.getAll("categoryIds") as string[];
    const displayAttributes = formData.getAll("displayAttributes") as string[];
    const selectedColorIds = formData.getAll("selectedColorIds") as string[];
    const selectedSizeIds = formData.getAll("selectedSizeIds") as string[];

    const isActive = formData.getAll("isActive").includes("true");
    const isFeatured = formData.getAll("isFeatured").includes("true");

    if (!name) {
      return { error: "Product name is required." };
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!finalSlug) {
      return { error: "URL slug is required." };
    }

    const price = parseFloat(priceRaw);
    if (isNaN(price) || price < 0) {
      return { error: "Please enter a valid selling price." };
    }

    const compareAtPrice = compareAtPriceRaw && compareAtPriceRaw.trim() !== ""
      ? parseFloat(compareAtPriceRaw)
      : null;
    if (compareAtPriceRaw && compareAtPriceRaw.trim() !== "" && (isNaN(compareAtPrice!) || compareAtPrice! < 0)) {
      return { error: "Compare at price must be a valid positive number." };
    }

    const costPrice = costPriceRaw && costPriceRaw.trim() !== ""
      ? parseFloat(costPriceRaw)
      : null;
    if (costPriceRaw && costPriceRaw.trim() !== "" && (isNaN(costPrice!) || costPrice! < 0)) {
      return { error: "Cost price must be a valid positive number." };
    }

    const weight = weightRaw && weightRaw.trim() !== ""
      ? parseFloat(weightRaw)
      : null;
    if (weightRaw && weightRaw.trim() !== "" && (isNaN(weight!) || weight! < 0)) {
      return { error: "Weight must be a valid positive number." };
    }

    const stock = parseInt(stockRaw) || 0;
    const lowStockAlert = parseInt(lowStockAlertRaw) || 5;

    // Check slug uniqueness if changed
    if (finalSlug !== existingProduct.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug: finalSlug },
      });
      if (slugExists) {
        return { error: `Product with URL slug "${finalSlug}" already exists. Please choose a different slug.` };
      }
    }

    // Check SKU uniqueness if provided
    const finalSku = sku || null;
    if (finalSku) {
      const existingSku = await db.product.findFirst({
        where: {
          sku: { equals: finalSku, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (existingSku) {
        return { error: `SKU "${finalSku}" is already assigned to another product.` };
      }
    }

    await db.product.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        shortDescription: shortDescription || null,
        sku: finalSku,
        price,
        compareAtPrice,
        costPrice,
        stock,
        lowStockAlert,
        isActive,
        isFeatured,
        weight,
        displayAttributes,
        selectedColorIds,
        selectedSizeIds,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        categories: {
          deleteMany: {},
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      },
    });

    // Sync variant prices for this product so product page & variants stay in sync
    await db.variant.updateMany({
      where: { productId: id },
      data: {
        price,
      },
    });

    // Process image uploads if present
    const files = formData.getAll("files") as File[];
    if (files && files.length > 0 && files[0] && files[0].size > 0) {
      const uploadRes = await uploadProductImages(id, formData);
      if (uploadRes && uploadRes.error) {
        return { error: `Product updated, but image upload failed: ${uploadRes.error}` };
      }
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/shop");
    revalidatePath("/");
    if (existingProduct.slug) {
      revalidatePath(`/product/${existingProduct.slug}`);
    }
    if (finalSlug) {
      revalidatePath(`/product/${finalSlug}`);
    }
  } catch (err: any) {
    console.error("Failed to update product:", err);
    return { error: err?.message || "An unexpected database error occurred while updating product." };
  }

  redirect(`/admin/products/${id}?updated=true`);
}

// Delete product
export async function deleteProduct(id: string) {
  await db.product.delete({
    where: { id },
  });

  revalidatePath("/admin/products");
}

// Toggle product active status
export async function toggleProductStatus(id: string, isActive: boolean) {
  await db.product.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/products");
}

// Quick update product (Title, SKU, Price, Categories)
export async function quickUpdateProduct(
  id: string,
  data: {
    name: string;
    sku: string | null;
    price: number;
    categoryIds: string[];
  }
) {
  const name = data.name.trim();
  const sku = data.sku ? data.sku.trim() : null;
  const price = Number(data.price);
  const categoryIds = data.categoryIds || [];

  if (!name) {
    throw new Error("Product title is required");
  }

  if (isNaN(price) || price < 0) {
    throw new Error("Valid price is required");
  }

  // Check if SKU exists on another product if provided
  if (sku) {
    const existingSku = await db.product.findFirst({
      where: {
        sku: { equals: sku, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (existingSku) {
      throw new Error(`SKU "${sku}" is already assigned to another product.`);
    }
  }

  const existingProduct = await db.product.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  await db.product.update({
    where: { id },
    data: {
      name,
      sku: sku || null,
      price,
      categories: {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      },
    },
  });

  // Sync variant prices for this product
  await db.variant.updateMany({
    where: { productId: id },
    data: { price },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");
  if (existingProduct.slug) {
    revalidatePath(`/product/${existingProduct.slug}`);
  }
}



