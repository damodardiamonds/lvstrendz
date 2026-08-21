"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
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

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err: any) {
    if (err?.code !== "EEXIST") {
      throw new Error(
        "Local file storage cannot write to disk. Please configure Cloudinary environment variables for cloud image uploads."
      );
    }
  }
}

async function uploadToCloudinaryInternal(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileBaseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const sanitizedBaseName = fileBaseName.replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 80);
  const uniquePublicId = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `lvstrendz/${folder}`, resource_type: "image", format: "webp", public_id: uniquePublicId },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result.secure_url);
        else reject(new Error("Upload returned no result"));
      }
    );
    uploadStream.end(buffer);
  });
}

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
    console.error("Failed to revalidate product page:", err);
  }
}

/**
 * Upload product images — called from ProductForm client component after product is saved.
 */
export async function uploadImagesForProduct(
  productId: string,
  formData: FormData
): Promise<{ error?: string; results?: { success?: boolean; error?: string; filename?: string }[] }> {
  const files = formData.getAll("files") as File[];
  const alts = formData.getAll("alts") as string[];
  const colorIds = formData.getAll("colorIds") as string[];
  const storageOption = (formData.get("storage") as string) || (useCloudinary ? "cloudinary" : "local");

  if (!files || files.length === 0 || (files.length === 1 && files[0].size === 0)) {
    return { results: [] };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  const results: { success?: boolean; error?: string; filename?: string }[] = [];

  let lastImage = await db.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
  });
  let currentSortOrder = (lastImage?.sortOrder ?? -1) + 1;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || file.size === 0) continue;

    const alt = alts[i] || "";
    const rawColorId = colorIds[i]?.trim();
    const colorId = rawColorId && rawColorId !== "null" && rawColorId !== "undefined" ? rawColorId : null;

    if (!allowedTypes.includes(file.type)) {
      results.push({ error: `"${file.name}" is not an allowed format (JPG, PNG, WebP, AVIF).`, filename: file.name });
      continue;
    }

    if (file.size > 10 * 1024 * 1024) {
      results.push({ error: `"${file.name}" exceeds the 10MB size limit.`, filename: file.name });
      continue;
    }

    let imageUrl = "";

    if (storageOption === "cloudinary" && useCloudinary) {
      try {
        imageUrl = await uploadToCloudinaryInternal(file, "products");
      } catch (err: any) {
        console.error(`Cloudinary upload failed for "${file.name}":`, err);
        results.push({ error: `Cloudinary upload failed for "${file.name}": ${err.message || err}`, filename: file.name });
        continue;
      }
    } else {
      if (storageOption === "cloudinary" && !useCloudinary) {
        results.push({ error: "Cloudinary is not configured. Please configure Cloudinary environment variables.", filename: file.name });
        continue;
      }
      try {
        await ensureUploadDir();
        const bytes = await file.arrayBuffer();
        let webpBuffer: Buffer;
        try {
          webpBuffer = await sharp(Buffer.from(bytes)).webp({ quality: 80 }).toBuffer();
        } catch (sharpErr: any) {
          results.push({ error: `Failed to process "${file.name}": ${sharpErr.message}`, filename: file.name });
          continue;
        }
        const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}.webp`;
        const filepath = path.join(UPLOAD_DIR, filename);
        await writeFile(filepath, webpBuffer);
        imageUrl = `/uploads/products/${filename}`;
      } catch (err: any) {
        console.error(`Local image saving failed for "${file.name}":`, err);
        results.push({ error: err?.message || `Failed to save "${file.name}".`, filename: file.name });
        continue;
      }
    }

    try {
      await db.productImage.create({
        data: {
          productId,
          url: imageUrl,
          alt: alt || null,
          sortOrder: currentSortOrder++,
          colorId: colorId || null,
        },
      });
      results.push({ success: true, filename: file.name });
    } catch (err: any) {
      console.error(`DB save failed for "${file.name}":`, err);
      results.push({ error: `Failed to save "${file.name}" to database.`, filename: file.name });
    }
  }

  try {
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
  } catch (revErr) {
    console.warn("Revalidation warning:", revErr);
  }

  const errors = results.filter((r) => r.error).map((r) => r.error);
  if (errors.length > 0) {
    return { error: errors.join("; "), results };
  }
  return { results };
}
