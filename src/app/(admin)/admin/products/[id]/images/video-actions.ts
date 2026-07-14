
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

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lvstrendz/${folder}`,
        resource_type: "auto",
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

  let videoUrl = "";

  if (useCloudinary) {
    try {
      videoUrl = await uploadToCloudinary(file, "videos");
    } catch (err: any) {
      console.error("Cloudinary video upload failed:", err);
      return { error: `Cloudinary video upload failed: ${err.message || err}` };
    }
  } else {
    await ensureVideoDir();

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(VIDEO_UPLOAD_DIR, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));
    videoUrl = `/uploads/videos/${filename}`;
  }

  // Save to database
  await db.productVideo.create({
    data: {
      productId,
      url: videoUrl,
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

  // Delete file from disk or Cloudinary
  if (video.url.includes("res.cloudinary.com")) {
    const publicId = getCloudinaryPublicId(video.url);
    if (publicId && useCloudinary) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      } catch (err) {
        console.error("Failed to delete video from Cloudinary:", err);
      }
    }
  } else {
    try {
      const filepath = path.join(process.cwd(), "public", video.url);
      await unlink(filepath);
    } catch {
      // File may not exist on disk
    }
  }

  // Delete from database
  await db.productVideo.delete({
    where: { id: videoId },
  });

  revalidatePath(`/admin/products/${productId}/images`);
}

