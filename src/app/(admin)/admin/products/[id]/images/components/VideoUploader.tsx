
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Video, Upload, Trash2, X, CheckCircle } from "lucide-react";
import { deleteProductVideo } from "../video-actions";

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
      setError("Only MP4 and WebM videos are allowed");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Video size must be less than 50MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("title", title);

      const res = await fetch(`/api/admin/products/${productId}/video`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || "Video upload failed. Please try again.");
      } else {
        setSelectedFile(null);
        setPreview(null);
        setTitle("");
        setSuccess("Video uploaded successfully!");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Video upload failed. Please try again.");
    } finally {
      setUploading(false);
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
                MP4 or WebM • Max 50MB
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
                <button
                  onClick={clearSelection}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product showcase, How to style..."
                  className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Video"}
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

