
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const VIDEO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "videos");

async function ensureVideoDir() {
  try {
    await mkdir(VIDEO_UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// Upload product video (max 2 per product)
export async function uploadProductVideo(productId: string, formData: FormData) {
  // Check existing video count
  const existingCount = await db.productVideo.count({
    where: { productId },
  });

  if (existingCount >= 2) {
    return { error: "Maximum 2 videos per product. Delete one to upload a new one." };
  }

  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  // Validate file type
  const allowedTypes = ["video/mp4", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only MP4 and WebM videos are allowed" };
  }

  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { error: "Video size must be less than 50MB" };
  }

  await ensureVideoDir();

  // Generate unique filename
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(VIDEO_UPLOAD_DIR, filename);

  // Write file to disk
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  // Save to database
  await db.productVideo.create({
    data: {
      productId,
      url: `/uploads/videos/${filename}`,
      title: title || null,
      sortOrder: existingCount,
    },
  });

  revalidatePath(`/admin/products/${productId}/images`);
  return { success: true };
}

// Delete product video
export async function deleteProductVideo(videoId: string, productId: string) {
  const video = await db.productVideo.findUnique({
    where: { id: videoId },
  });

  if (!video) return;

  // Delete file from disk
  try {
    const filepath = path.join(process.cwd(), "public", video.url);
    await unlink(filepath);
  } catch {
    // File may not exist on disk
  }

  // Delete from database
  await db.productVideo.delete({
    where: { id: videoId },
  });

  revalidatePath(`/admin/products/${productId}/images`);
}

