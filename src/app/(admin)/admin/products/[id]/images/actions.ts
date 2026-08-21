
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

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
  const fileBaseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const sanitizedBaseName = fileBaseName
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 80);
  const uniquePublicId = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lvstrendz/${folder}`,
        resource_type: "image",
        format: "webp",
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

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err: any) {
    if (err?.code !== "EEXIST") {
      throw new Error(
        "Cannot create upload directory. If running on a read-only filesystem (e.g. Vercel), please configure Cloudinary environment variables."
      );
    }
  }
}

/** Convert image buffer to WebP using sharp — returns original buffer if sharp is unavailable */
async function toWebpBuffer(inputBuffer: Buffer): Promise<{ buffer: Buffer; ext: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const webpBuf = await sharp(inputBuffer).webp({ quality: 80 }).toBuffer();
    return { buffer: webpBuf, ext: "webp" };
  } catch {
    // sharp not available or failed — store original
    return { buffer: inputBuffer, ext: "png" };
  }
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
    console.error("Failed to revalidate public product page:", err);
  }
}

// Upload multiple product images in a single server request
export async function uploadProductImages(productId: string, formData: FormData) {
  try {
    const files = formData.getAll("files") as File[];
    const alts = formData.getAll("alts") as string[];
    const variantIds = formData.getAll("variantIds") as string[];
    const colorIds = formData.getAll("colorIds") as string[];
    const storageOption =
      (formData.get("storage") as string) || (useCloudinary ? "cloudinary" : "local");

    if (!files || files.length === 0) {
      return { error: "No files selected" };
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
      const alt = alts[i] || "";
      const rawVariantId = variantIds[i]?.trim();
      const variantId =
        rawVariantId && rawVariantId !== "null" && rawVariantId !== "undefined"
          ? rawVariantId
          : null;
      const rawColorId = colorIds[i]?.trim();
      const colorId =
        rawColorId && rawColorId !== "null" && rawColorId !== "undefined"
          ? rawColorId
          : null;

      if (!file || file.size === 0) {
        results.push({ error: "Empty file selected" });
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        results.push({
          error: `File "${file.name}" is not an allowed format (only JPG, PNG, WebP, AVIF).`,
          filename: file.name,
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        results.push({
          error: `File "${file.name}" exceeds the 10 MB size limit.`,
          filename: file.name,
        });
        continue;
      }

      let imageUrl = "";
      const shouldUploadToCloudinary = storageOption === "cloudinary" && useCloudinary;

      if (shouldUploadToCloudinary) {
        try {
          imageUrl = await uploadToCloudinary(file, "products");
        } catch (err: any) {
          console.error(`Cloudinary upload failed for "${file.name}":`, err);
          results.push({
            error: `Cloudinary upload failed for "${file.name}": ${err?.message || err}`,
            filename: file.name,
          });
          continue;
        }
      } else {
        if (storageOption === "cloudinary" && !useCloudinary) {
          results.push({
            error:
              "Cloudinary is not configured. Please upload locally or configure Cloudinary environment variables.",
            filename: file.name,
          });
          continue;
        }

        try {
          await ensureUploadDir();

          const bytes = await file.arrayBuffer();
          const { buffer: outputBuffer, ext } = await toWebpBuffer(Buffer.from(bytes));

          const filename = `${productId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}-${i}.${ext}`;
          const filepath = path.join(UPLOAD_DIR, filename);
          await writeFile(filepath, outputBuffer);
          imageUrl = `/uploads/products/${filename}`;
        } catch (err: any) {
          console.error(`Local image saving failed for "${file.name}":`, err);
          results.push({
            error: err?.message || `Failed to save "${file.name}" to local disk.`,
            filename: file.name,
          });
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
            variantId: variantId || null,
            colorId: colorId || null,
          },
        });
        results.push({ success: true, filename: file.name });
      } catch (err: any) {
        console.error(`Database save failed for "${file.name}":`, err);
        results.push({
          error: `Failed to save image "${file.name}" to database.`,
          filename: file.name,
        });
      }
    }

    const shouldRevalidate = formData.get("revalidate") !== "false";
    if (shouldRevalidate) {
      try {
        revalidatePath(`/admin/products/${productId}/images`);
        await revalidateProductPage(productId);
      } catch (revErr) {
        console.warn("Revalidation warning:", revErr);
      }
    }

    const errors = results.filter((r) => r.error).map((r) => r.error);
    if (errors.length > 0) {
      return { error: errors.join("; "), results };
    }
    return { results };
  } catch (err: any) {
    console.error("uploadProductImages unhandled error:", err);
    return {
      error:
        err?.message ||
        "An unexpected error occurred during image upload. Please check server logs.",
    };
  }
}

// Delete product image
export async function deleteProductImage(imageId: string, productId: string) {
  try {
    const image = await db.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) return;

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

    await db.productImage.delete({
      where: { id: imageId },
    });

    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
  } catch (err: any) {
    console.error("deleteProductImage error:", err);
    return { error: err?.message || "Failed to delete image." };
  }
}

// Update image sort order
export async function updateImageOrder(productId: string, imageIds: string[]) {
  try {
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
  } catch (err: any) {
    console.error("updateImageOrder error:", err);
    return { error: err?.message || "Failed to update image order." };
  }
}

// Update image alt text
export async function updateImageAlt(imageId: string, productId: string, alt: string) {
  try {
    await db.productImage.update({
      where: { id: imageId },
      data: { alt },
    });
    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
  } catch (err: any) {
    console.error("updateImageAlt error:", err);
    return { error: err?.message || "Failed to update alt text." };
  }
}

// Update image variant link
export async function updateImageVariant(
  imageId: string,
  productId: string,
  variantId: string | null
) {
  try {
    await db.productImage.update({
      where: { id: imageId },
      data: { variantId: variantId || null },
    });
    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
    return { success: true };
  } catch (err: any) {
    console.error("updateImageVariant error:", err);
    return { error: err?.message || "Failed to update image variant." };
  }
}

// Update image color link
export async function updateImageColor(
  imageId: string,
  productId: string,
  colorId: string | null
) {
  try {
    await db.productImage.update({
      where: { id: imageId },
      data: { colorId: colorId || null },
    });
    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
    return { success: true };
  } catch (err: any) {
    console.error("updateImageColor error:", err);
    return { error: err?.message || "Failed to update image color." };
  }
}

// Bulk delete product images
export async function deleteProductImages(imageIds: string[], productId: string) {
  try {
    if (imageIds.length === 0) return { success: true };

    const images = await db.productImage.findMany({
      where: { id: { in: imageIds } },
    });

    for (const image of images) {
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

    await db.productImage.deleteMany({
      where: { id: { in: imageIds } },
    });

    revalidatePath(`/admin/products/${productId}/images`);
    await revalidateProductPage(productId);
    return { success: true };
  } catch (err: any) {
    console.error("deleteProductImages error:", err);
    return { error: err?.message || "Failed to delete images." };
  }
}
