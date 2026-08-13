import { NextRequest, NextResponse } from "next/server";
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

// Helper to upload video buffer stream to Cloudinary
async function uploadVideoToCloudinary(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const sanitizedBaseName = fileBaseName
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 80);
  const uniquePublicId = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lvstrendz/${folder}`,
        resource_type: "video", // Explicitly required for video files in Cloudinary
        public_id: uniquePublicId,
        chunk_size: 6000000,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload returned no result from Cloudinary"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

const VIDEO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "videos");

async function ensureVideoDir() {
  try {
    await mkdir(VIDEO_UPLOAD_DIR, { recursive: true });
  } catch (err: any) {
    if (err?.code !== "EEXIST") {
      throw new Error(
        "Local file storage cannot write to disk. Please configure Cloudinary environment variables."
      );
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Check existing video count
    const existingCount = await db.productVideo.count({
      where: { productId },
    });

    if (existingCount >= 2) {
      return NextResponse.json(
        { error: "Maximum 2 videos per product. Delete one to upload a new one." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file selected" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only MP4 and WebM videos are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Video size must be less than 50MB" },
        { status: 400 }
      );
    }

    let videoUrl = "";

    if (useCloudinary) {
      try {
        videoUrl = await uploadVideoToCloudinary(file, "videos");
      } catch (err: any) {
        console.error("Cloudinary video upload failed:", err);
        return NextResponse.json(
          { error: `Cloudinary video upload failed: ${err.message || err}` },
          { status: 500 }
        );
      }
    } else {
      await ensureVideoDir();
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const filename = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filepath = path.join(VIDEO_UPLOAD_DIR, filename);

      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));
      videoUrl = `/uploads/videos/${filename}`;
    }

    const newVideo = await db.productVideo.create({
      data: {
        productId,
        url: videoUrl,
        title: title || null,
        sortOrder: existingCount,
      },
    });

    revalidatePath(`/admin/products/${productId}/images`);

    return NextResponse.json({ success: true, video: newVideo });
  } catch (err: any) {
    console.error("Video upload route error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process video upload" },
      { status: 500 }
    );
  }
}
