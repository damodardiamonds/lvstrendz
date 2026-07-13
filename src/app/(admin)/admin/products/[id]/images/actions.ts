
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// Helper to revalidate the public product details page
async function revalidateProductPage(productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product?.slug) {
      revalidatePath(`/product/${product.slug}`);
    }
  } catch (err) {
    console.error("Failed to revalidate public product page:", err);
  }
}

// Upload product image
export async function uploadProductImage(productId: string, formData: FormData) {
  const file = formData.get("file") as File;
  const variantId = formData.get("variantId") as string | null;
  const alt = formData.get("alt") as string;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, WebP, and AVIF images are allowed" };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be less than 5MB" };
  }

  await ensureUploadDir();

  // Generate unique filename
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Write file to disk
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  // Get current max sort order
  const lastImage = await db.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastImage?.sortOrder ?? -1) + 1;

  // Save to database
  await db.productImage.create({
    data: {
      productId,
      url: `/uploads/products/${filename}`,
      alt: alt || null,
      sortOrder,
      variantId: variantId || null,
    },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
  return { success: true };
}

// Delete product image
export async function deleteProductImage(imageId: string, productId: string) {
  const image = await db.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) return;

  // Delete file from disk
  try {
    const filepath = path.join(process.cwd(), "public", image.url);
    await unlink(filepath);
  } catch {
    // File may not exist on disk
  }

  // Delete from database
  await db.productImage.delete({
    where: { id: imageId },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
}

// Update image sort order
export async function updateImageOrder(
  productId: string,
  imageIds: string[]
) {
  await Promise.all(
    imageIds.map((id, index) =>
      db.productImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
}

// Update image alt text
export async function updateImageAlt(imageId: string, productId: string, alt: string) {
  await db.productImage.update({
    where: { id: imageId },
    data: { alt },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
}

// Update image variant link
export async function updateImageVariant(
  imageId: string,
  productId: string,
  variantId: string | null
) {
  await db.productImage.update({
    where: { id: imageId },
    data: { variantId: variantId || null },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
  return { success: true };
}

