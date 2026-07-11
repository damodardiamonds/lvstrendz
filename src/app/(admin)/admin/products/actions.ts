
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create product
export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const shortDescription = formData.get("shortDescription") as string;
  const sku = formData.get("sku") as string;
  const price = parseFloat(formData.get("price") as string);
  const compareAtPrice = formData.get("compareAtPrice")
    ? parseFloat(formData.get("compareAtPrice") as string)
    : null;
  const costPrice = formData.get("costPrice")
    ? parseFloat(formData.get("costPrice") as string)
    : null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const lowStockAlert = parseInt(formData.get("lowStockAlert") as string) || 5;
  const isActive = formData.get("isActive") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const weight = formData.get("weight")
    ? parseFloat(formData.get("weight") as string)
    : null;
  const metaTitle = formData.get("metaTitle") as string;
  const metaDescription = formData.get("metaDescription") as string;

  await db.product.create({
    data: {
      name,
      slug,
      description: description || null,
      shortDescription: shortDescription || null,
      sku: sku || null,
      price,
      compareAtPrice,
      costPrice,
      stock,
      lowStockAlert,
      isActive,
      isFeatured,
      weight,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

// Update product
export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const shortDescription = formData.get("shortDescription") as string;
  const sku = formData.get("sku") as string;
  const price = parseFloat(formData.get("price") as string);
  const compareAtPrice = formData.get("compareAtPrice")
    ? parseFloat(formData.get("compareAtPrice") as string)
    : null;
  const costPrice = formData.get("costPrice")
    ? parseFloat(formData.get("costPrice") as string)
    : null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const lowStockAlert = parseInt(formData.get("lowStockAlert") as string) || 5;
  const isActive = formData.get("isActive") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const weight = formData.get("weight")
    ? parseFloat(formData.get("weight") as string)
    : null;
  const metaTitle = formData.get("metaTitle") as string;
  const metaDescription = formData.get("metaDescription") as string;

  await db.product.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      shortDescription: shortDescription || null,
      sku: sku || null,
      price,
      compareAtPrice,
      costPrice,
      stock,
      lowStockAlert,
      isActive,
      isFeatured,
      weight,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
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

