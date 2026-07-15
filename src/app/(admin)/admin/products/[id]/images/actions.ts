
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

  // Generate a unique public ID based on original filename to prevent duplicate/overwrite issues in Cloudinary
  const fileBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const sanitizedBaseName = fileBaseName
    .replace(/[^a-zA-Z0-9-_]/g, "_") // Remove special characters
    .substring(0, 80); // Limit length
  const uniquePublicId = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lvstrendz/${folder}`,
        resource_type: "image",
        format: "webp", // Force WebP conversion on upload
        public_id: uniquePublicId,
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

// Upload multiple product images in a single server request (prevents browser/Next.js loop duplicate bugs)
export async function uploadProductImages(productId: string, formData: FormData) {
  const files = formData.getAll("files") as File[];
  const alts = formData.getAll("alts") as string[];
  const variantIds = formData.getAll("variantIds") as string[];
  const storageOption = formData.get("storage") as string || "local";

  if (!files || files.length === 0) {
    return { error: "No files selected" };
  }

  // Validate file types
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  const results: { success?: boolean; error?: string; filename?: string }[] = [];

  // Get current max sort order to append correctly
  let lastImage = await db.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
  });
  let currentSortOrder = (lastImage?.sortOrder ?? -1) + 1;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const alt = alts[i] || "";
    const variantId = variantIds[i] || null;

    if (!file || file.size === 0) {
      results.push({ error: "Empty file selected" });
      continue;
    }

    if (!allowedTypes.includes(file.type)) {
      results.push({ error: `File "${file.name}" is not an allowed format (only JPG, PNG, WebP, AVIF).`, filename: file.name });
      continue;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      results.push({ error: `File "${file.name}" exceeds the 5MB size limit.`, filename: file.name });
      continue;
    }

    let imageUrl = "";
    const shouldUploadToCloudinary = storageOption === "cloudinary" && useCloudinary;

    if (shouldUploadToCloudinary) {
      try {
        imageUrl = await uploadToCloudinary(file, "products");
      } catch (err: any) {
        console.error(`Cloudinary upload failed for "${file.name}":`, err);
        results.push({ error: `Cloudinary upload failed for "${file.name}": ${err.message || err}`, filename: file.name });
        continue;
      }
    } else {
      if (storageOption === "cloudinary" && !useCloudinary) {
        results.push({ error: "Cloudinary is not configured. Please upload locally.", filename: file.name });
        continue;
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
        console.error(`Local WebP conversion failed for "${file.name}":`, err);
        results.push({ error: `Failed to convert "${file.name}" to WebP.`, filename: file.name });
        continue;
      }

      // Generate unique filename with .webp extension (appended with file index for uniqueness)
      const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}.webp`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Write WebP buffer to disk
      await writeFile(filepath, webpBuffer);
      imageUrl = `/uploads/products/${filename}`;
    }

    // Save to database
    try {
      await db.productImage.create({
        data: {
          productId,
          url: imageUrl,
          alt: alt || null,
          sortOrder: currentSortOrder++,
          variantId: variantId || null,
        },
      });
      results.push({ success: true, filename: file.name });
    } catch (err: any) {
      console.error(`Database save failed for "${file.name}":`, err);
      results.push({ error: `Failed to save image "${file.name}" to database.`, filename: file.name });
    }
  }

  revalidatePath(`/admin/products/${productId}/images`);
  await revalidateProductPage(productId);
  return { results };
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

