// src/app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = !!(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat");

async function uploadToCloudinary(file: File, buffer: Buffer): Promise<string> {
  const fileBaseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const sanitizedBaseName = fileBaseName
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 60);
  const uniquePublicId = `${sanitizedBaseName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: "lvstrendz/chat",
      public_id: uniquePublicId,
      resource_type: isPdf ? "auto" : isImage ? "image" : "auto",
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary returned no secure URL"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let fileUrl = "";

    if (isCloudinaryConfigured) {
      try {
        fileUrl = await uploadToCloudinary(file, buffer);
      } catch (err: any) {
        console.warn("Cloudinary upload failed, attempting local fallback:", err?.message || err);
      }
    }

    // If Cloudinary wasn't configured or failed, save locally
    if (!fileUrl) {
      await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
      const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
      const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filepath = path.join(LOCAL_UPLOAD_DIR, safeName);

      await writeFile(filepath, buffer);
      fileUrl = `/uploads/chat/${safeName}`;
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Chat attachment upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
