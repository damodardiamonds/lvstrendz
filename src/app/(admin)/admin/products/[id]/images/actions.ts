
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

import {
  useCloudinary,
  uploadToCloudinary,
  getCloudinaryPublicId,
  ensureUploadDir,
  revalidateProductPage,
  uploadProductImagesHelper,
} from "@/lib/product-images";

// Upload multiple product images in a single server request (prevents browser/Next.js loop duplicate bugs)
export async function uploadProductImages(productId: string, formData: FormData) {
  return uploadProductImagesHelper(productId, formData);
}

// Delete product image
export async function deleteProductImage(imageId: string, productId: string) {
  const image = await db.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) return;

  // Delete file from disk or Cloudinary
  if (image.url.includes("res.cloudinary.com")) {
    const publicId = getCloudinaryPublicId(image.url);
    if (publicId && useCloudinary) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Failed to delete image from Cloudinary:", err);
      }
    }
  } else {
    try {
      const filepath = path.join(process.cwd(), "public", image.url);
      await unlink(filepath);
    } catch {
      // File may not exist on disk
    }
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

// Update image color link
export async function updateImageColor(
  imageId: string,
  productId: string,
  colorId: string | null
) {
  await db.productImage.update({
    where: { id: imageId },
    data: { colorId: colorId || null },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
  return { success: true };
}

// Bulk delete product images
export async function deleteProductImages(imageIds: string[], productId: string) {
  if (imageIds.length === 0) return { success: true };

  const images = await db.productImage.findMany({
    where: {
      id: { in: imageIds },
    },
  });

  for (const image of images) {
    // Delete file from disk or Cloudinary
    if (image.url.includes("res.cloudinary.com")) {
      const publicId = getCloudinaryPublicId(image.url);
      if (publicId && useCloudinary) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete image ${image.id} from Cloudinary:`, err);
        }
      }
    } else {
      try {
        const filepath = path.join(process.cwd(), "public", image.url);
        await unlink(filepath);
      } catch {
        // File may not exist on disk
      }
    }
  }

  // Delete from database
  await db.productImage.deleteMany({
    where: {
      id: { in: imageIds },
    },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
  return { success: true };
}

