
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Trash2, GripVertical } from "lucide-react";
import { uploadProductImages } from "../actions";

interface ColorOption {
  id: string;
  name: string;
  colorCode: string | null;
}

interface ImageUploaderProps {
  productId: string;
  variants?: { id: string; attributes: string }[];
  colors?: ColorOption[];
  isCloudinaryConfigured: boolean;
}

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  alt: string;
  colorId: string;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
}

export default function ImageUploader({ productId, colors = [], isCloudinaryConfigured }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [storage, setStorage] = useState<"cloudinary" | "local">(
    isCloudinaryConfigured ? "cloudinary" : "local"
  );
  const [bulkColorId, setBulkColorId] = useState("");
  const [globalError, setGlobalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleQueueDragStart = (index: number) => {
    setDraggedQueueIndex(index);
  };

  const handleQueueDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedQueueIndex === null || draggedQueueIndex === index) return;

    const newQueue = [...uploadQueue];
    const [dragged] = newQueue.splice(draggedQueueIndex, 1);
    newQueue.splice(index, 0, dragged);
    setUploadQueue(newQueue);
    setDraggedQueueIndex(index);
  };

  const handleQueueDragEnd = () => {
    setDraggedQueueIndex(null);
  };

  // Keep a ref to the queue for unmount cleanup
  const queueRef = useRef<UploadItem[]>([]);
  queueRef.current = uploadQueue;

  useEffect(() => {
    return () => {
      // Revoke all preview URLs to prevent memory leaks when component unmounts
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const handleFiles = (files: FileList | File[]) => {
    setGlobalError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const newItems: UploadItem[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`"${file.name}" is not an allowed image format (only JPG, PNG, WebP, AVIF)`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 10MB size limit`);
        return;
      }
      newItems.push({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        preview: URL.createObjectURL(file),
        alt: "",
        colorId: "",
        status: "idle",
      });
    });

    if (errors.length > 0) {
      setGlobalError(errors.join(". "));
    }

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
    }

    // Reset file input value so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFiles(files);
  };

  const removeFile = (id: string) => {
    const item = uploadQueue.find((q) => q.id === id);
    if (item) {
      URL.revokeObjectURL(item.preview);
    }
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const clearQueue = () => {
    uploadQueue.forEach((item) => URL.revokeObjectURL(item.preview));
    setUploadQueue([]);
    setGlobalError("");
    setBulkColorId("");
  };

  const clearCompleted = () => {
    const completed = uploadQueue.filter((q) => q.status === "success");
    completed.forEach((item) => URL.revokeObjectURL(item.preview));
    setUploadQueue((prev) => prev.filter((q) => q.status !== "success"));
  };

  const applyBulkColor = () => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.status === "idle" || item.status === "error"
          ? { ...item, colorId: bulkColorId }
          : item
      )
    );
  };

  // Compress image on client canvas if larger than 1.5MB to avoid Vercel 4.5MB payload limit errors
  const compressImageIfNeeded = async (file: File): Promise<File> => {
    if (file.size <= 1.5 * 1024 * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxDim = 2560;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  const handleUpload = async () => {
    const pendingItems = uploadQueue.filter((item) => item.status !== "success");
    if (pendingItems.length === 0) return;

    setUploading(true);
    setGlobalError("");

    // Set all pending items status to uploading
    setUploadQueue((prev) =>
      prev.map((q) => (q.status !== "success" ? { ...q, status: "uploading", error: undefined } : q))
    );

    // Upload files sequentially to avoid Vercel / server request payload limits
    let uploadFailed = false;
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      // Compress large images client-side to prevent Vercel 4.5MB request payload limit crash
      let fileToUpload = item.file;
      if (fileToUpload.size > 1.5 * 1024 * 1024) {
        try {
          fileToUpload = await compressImageIfNeeded(fileToUpload);
        } catch {
          // Fall back to original file if canvas compression fails
        }
      }

      // Check if file is still over 4.2 MB after compression
      if (fileToUpload.size > 4.2 * 1024 * 1024) {
        uploadFailed = true;
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "error",
                  error: `File size (${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB) exceeds server 4.5 MB request limit. Please upload a smaller image.`,
                }
              : q
          )
        );
        continue;
      }

      const formData = new FormData();
      formData.set("storage", storage);
      formData.append("files", fileToUpload);
      formData.append("alts", "");
      formData.append("variantIds", "");
      formData.append("colorIds", item.colorId || "");
      
      const isLast = i === pendingItems.length - 1;
      formData.set("revalidate", isLast ? "true" : "false");

      try {
        const result = await uploadProductImages(productId, formData);
        if (result.error) {
          uploadFailed = true;
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: result.error } : q))
          );
        } else if (result.results && result.results[0]) {
          const res = result.results[0];
          if (res.error) {
            uploadFailed = true;
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: res.error } : q))
            );
          } else {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q))
            );
          }
        }
      } catch (err: any) {
        uploadFailed = true;
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: err.message || "Upload failed" } : q))
        );
      }
    }

    // Force route cache refresh to show successfully uploaded images
    router.refresh();
    setUploading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Upload Images</h3>
          <p className="text-xs text-gray-500 mt-0.5">Choose where to store your product media files</p>
        </div>

        {/* Storage Option Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">Storage Destination:</span>
          <select
            value={storage}
            disabled={uploading}
            onChange={(e) => setStorage(e.target.value as "cloudinary" | "local")}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] bg-white disabled:bg-gray-100 cursor-pointer"
          >
            {isCloudinaryConfigured && (
              <option value="cloudinary">Cloudinary (Recommended - WebP)</option>
            )}
            <option value="local">Local Server (WebP Auto-Convert)</option>
          </select>
          {!isCloudinaryConfigured && (
            <span className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-200/60 px-2 py-1 rounded-md">
              Cloudinary not configured in .env
            </span>
          )}
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-[#A0463E] bg-[#A0463E]/5"
            : "border-gray-300 hover:border-[#A0463E] hover:bg-gray-50"
        } ${uploadQueue.length > 0 ? "p-4" : "p-8"}`}
      >
        <Upload size={uploadQueue.length > 0 ? 24 : 32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">
          Drag & drop images here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, WebP, AVIF • Max 10MB per image • You can select multiple files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) handleFiles(files);
          }}
          className="hidden"
        />
      </div>

      {uploadQueue.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          {/* Bulk Actions */}
          <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-4 mb-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Bulk Actions (Apply to all queued items)
            </h4>
            {colors.length > 0 ? (
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Bulk Color Link
                </label>
                <div className="flex gap-2">
                  <select
                    value={bulkColorId}
                    onChange={(e) => setBulkColorId(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E]"
                  >
                    <option value="">All Colors (general image)</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        🎨 {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={applyBulkColor}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-700 italic">
                No color attributes selected for this product yet. You can select color attributes in the product edit page.
              </p>
            )}
          </div>

          {/* Queue List */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-sm font-semibold text-gray-800">
              Upload Queue ({uploadQueue.length} {uploadQueue.length === 1 ? "file" : "files"})
            </h4>
            <button
              onClick={clearQueue}
              disabled={uploading}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {uploadQueue.map((item, index) => (
              <div
                key={item.id}
                draggable={!uploading && item.status !== "uploading"}
                onDragStart={() => handleQueueDragStart(index)}
                onDragOver={(e) => handleQueueDragOver(e, index)}
                onDragEnd={handleQueueDragEnd}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3 bg-gray-50 border rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                  draggedQueueIndex === index
                    ? "opacity-40 border-dashed border-[#A0463E]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Info / Preview */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <GripVertical size={16} className="text-gray-400 shrink-0" />
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.preview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 pointer-events-none"
                    />
                    {item.status === "success" && (
                      <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                        <AlertCircle size={12} />
                      </div>
                    )}
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        <Loader2 size={16} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-700 truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {item.error && (
                      <p className="text-[10px] text-red-600 mt-0.5 font-medium truncate" title={item.error}>
                        {item.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form fields - Color Selector Only */}
                {colors.length > 0 && (
                  <div className="w-full md:w-[220px] flex-shrink-0">
                    <select
                      value={item.colorId}
                      disabled={item.status === "uploading" || item.status === "success"}
                      onChange={(e) => {
                        setUploadQueue((prev) =>
                          prev.map((q) =>
                            q.id === item.id ? { ...q, colorId: e.target.value } : q
                          )
                        );
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] disabled:bg-gray-100 disabled:text-gray-400 bg-white"
                    >
                      <option value="">All Colors (Default)</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          🎨 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => removeFile(item.id)}
                  disabled={item.status === "uploading" || uploading}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 self-end md:self-auto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 px-1">
            <div className="text-xs text-gray-500 flex items-center gap-3">
              <span>
                {uploadQueue.filter((q) => q.status === "success").length} of {uploadQueue.length} uploaded
              </span>
              {uploadQueue.some((q) => q.status === "success") && (
                <button
                  onClick={clearCompleted}
                  disabled={uploading}
                  className="text-[#A0463E] hover:underline font-medium transition-colors disabled:opacity-50"
                >
                  Clear Completed
                </button>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || uploadQueue.every((q) => q.status === "success")}
              className="px-5 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload All"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


