
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
   process.env.CLOUDINARY_API_KEY &&
   process.env.CLOUDINARY_API_SECRET)
);

// Helper to upload a buffer stream to Cloudinary
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lvstrendz/${folder}`,
        resource_type: "image",
        format: "webp", // Force WebP conversion on upload
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload returned no result"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// Helper to extract Cloudinary public ID from URL
function getCloudinaryPublicId(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let publicIdWithExt = parts[1];
    const slashIndex = publicIdWithExt.indexOf("/");
    if (slashIndex !== -1 && /^v\d+$/.test(publicIdWithExt.substring(0, slashIndex))) {
      publicIdWithExt = publicIdWithExt.substring(slashIndex + 1);
    }
    
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch {
    return null;
  }
}

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
  const storageOption = formData.get("storage") as string || "local";

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

  let imageUrl = "";
  const shouldUploadToCloudinary = storageOption === "cloudinary" && useCloudinary;

  if (shouldUploadToCloudinary) {
    try {
      imageUrl = await uploadToCloudinary(file, "products");
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      return { error: `Cloudinary upload failed: ${err.message || err}` };
    }
  } else {
    if (storageOption === "cloudinary" && !useCloudinary) {
      return { error: "Cloudinary is not configured. Please upload locally." };
    }

    await ensureUploadDir();

    // Convert local upload to WebP
    const bytes = await file.arrayBuffer();
    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(Buffer.from(bytes))
        .webp({ quality: 80 })
        .toBuffer();
    } catch (err: any) {
      console.error("Local WebP conversion failed:", err);
      return { error: `Failed to convert image to WebP: ${err.message || err}` };
    }

    // Generate unique filename with .webp extension
    const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write WebP buffer to disk
    await writeFile(filepath, webpBuffer);
    imageUrl = `/uploads/products/${filename}`;
  }

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
      url: imageUrl,
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

