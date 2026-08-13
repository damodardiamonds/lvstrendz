"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video, Upload, Trash2, X, CheckCircle, Loader2 } from "lucide-react";
import { deleteProductVideo, saveProductVideoUrl } from "../video-actions";

interface ProductVideo {
  id: string;
  url: string;
  title: string | null;
  sortOrder: number;
}

interface VideoUploaderProps {
  productId: string;
  videos: ProductVideo[];
}

export default function VideoUploader({ productId, videos }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (file: File) => {
    setError("");
    setSuccess("");
    const allowedTypes = ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only MP4 and WebM videos are allowed.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Video size must be under 50MB.");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    setStatusMessage("Preparing upload...");
    setError("");
    setSuccess("");

    try {
      // Step 1: Request signed upload credentials from server
      let signatureData: {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder: string;
      } | null = null;

      try {
        const sigRes = await fetch("/api/admin/cloudinary-signature");
        if (sigRes.ok) {
          signatureData = await sigRes.json();
        }
      } catch (err) {
        console.warn("Could not fetch Cloudinary upload signature:", err);
      }

      let videoUrl = "";

      if (signatureData && signatureData.cloudName && signatureData.signature) {
        // Step 2A: Direct browser-to-Cloudinary upload (bypasses Next.js 4.5MB payload limits)
        setStatusMessage("Uploading video directly to Cloudinary...");
        videoUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${signatureData!.cloudName}/video/upload`
          );

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                if (res.secure_url) {
                  resolve(res.secure_url);
                } else {
                  reject(new Error("Cloudinary did not return a valid secure URL."));
                }
              } catch {
                reject(new Error("Invalid response from Cloudinary."));
              }
            } else {
              try {
                const res = JSON.parse(xhr.responseText);
                reject(new Error(res.error?.message || "Cloudinary upload failed."));
              } catch {
                reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error during Cloudinary video upload."));

          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("api_key", signatureData!.apiKey);
          formData.append("timestamp", signatureData!.timestamp.toString());
          formData.append("signature", signatureData!.signature);
          formData.append("folder", signatureData!.folder);

          xhr.send(formData);
        });
      } else {
        // Step 2B: Fallback to Next.js API server endpoint if Cloudinary signature unavailable
        setStatusMessage("Uploading via server route...");
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("title", title);

        const res = await fetch(`/api/admin/products/${productId}/video`, {
          method: "POST",
          body: formData,
        });

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          if (res.status === 413 || !res.ok) {
            throw new Error(
              "Video file size is too large for the server limit. Please configure Cloudinary or select a smaller file."
            );
          }
          throw new Error("Video upload failed. Server returned an invalid response.");
        }

        if (!res.ok || data.error) {
          throw new Error(data.error || "Video upload failed. Please try again.");
        }
        videoUrl = data.video?.url;
      }

      // Step 3: Save video URL in database
      if (signatureData && videoUrl) {
        setStatusMessage("Saving video record...");
        const saveResult = await saveProductVideoUrl(productId, videoUrl, title);
        if (saveResult?.error) {
          throw new Error(saveResult.error);
        }
      }

      setSelectedFile(null);
      setPreview(null);
      setTitle("");
      setSuccess("Video uploaded successfully to Cloudinary!");
      router.refresh();
    } catch (err: any) {
      let errMsg = err?.message || "Video upload failed. Please try again.";
      if (
        errMsg.includes("not valid JSON") ||
        errMsg.includes("Request En") ||
        errMsg.includes("413") ||
        errMsg.includes("Unexpected token")
      ) {
        errMsg =
          "Video file size is too large for the server limit. Direct Cloudinary upload will bypass this limit.";
      }
      setError(errMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setStatusMessage("");
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeletingId(videoId);
    setError("");
    setSuccess("");
    try {
      await deleteProductVideo(videoId, productId);
      setSuccess("Video deleted successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to delete video.");
    } finally {
      setDeletingId(null);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setTitle("");
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video size={20} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Product Videos
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {videos.length}/2 videos uploaded
        </span>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Existing Videos */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative rounded-lg border border-gray-200 overflow-hidden"
            >
              <video
                src={video.url}
                className="w-full aspect-video object-cover bg-black"
                controls
                preload="metadata"
              />
              <div className="p-3 flex items-center justify-between">
                <p className="text-sm text-gray-700 truncate">
                  {video.title || "Untitled video"}
                </p>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Section (only show if less than 2 videos) */}
      {videos.length < 2 && (
        <>
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#A0463E] hover:bg-gray-50 transition-colors"
            >
              <Upload size={28} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload a video
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4 or WebM • Max 50MB (Uploaded directly to Cloudinary)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block">
                <video
                  src={preview}
                  className="w-64 aspect-video rounded-lg border border-gray-200 bg-black"
                  controls
                  preload="metadata"
                />
                {!uploading && (
                  <button
                    onClick={clearSelection}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  disabled={uploading}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product showcase, How to style..."
                  className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none disabled:bg-gray-100"
                />
              </div>

              {uploading && (
                <div className="w-full sm:w-1/2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin text-[#A0463E]" />
                      {statusMessage}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#A0463E] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading Video...</span>
                  </>
                ) : (
                  "Upload Video"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {videos.length >= 2 && (
        <p className="text-xs text-gray-500 mt-2">
          Maximum 2 videos reached. Delete one to upload a new video.
        </p>
      )}
    </div>
  );
}
