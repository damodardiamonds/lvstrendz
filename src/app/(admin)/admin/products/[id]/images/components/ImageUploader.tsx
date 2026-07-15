
"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { uploadProductImage } from "../actions";

interface ImageUploaderProps {
  productId: string;
  variants: { id: string; attributes: string }[];
}

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  alt: string;
  variantId: string;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
}

export default function ImageUploader({ productId, variants }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [bulkAlt, setBulkAlt] = useState("");
  const [bulkVariantId, setBulkVariantId] = useState("");
  const [globalError, setGlobalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 5MB size limit`);
        return;
      }
      newItems.push({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        preview: URL.createObjectURL(file),
        alt: "",
        variantId: "",
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
    setBulkAlt("");
    setBulkVariantId("");
  };

  const clearCompleted = () => {
    const completed = uploadQueue.filter((q) => q.status === "success");
    completed.forEach((item) => URL.revokeObjectURL(item.preview));
    setUploadQueue((prev) => prev.filter((q) => q.status !== "success"));
  };

  const applyBulkAlt = () => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.status === "idle" || item.status === "error"
          ? { ...item, alt: bulkAlt }
          : item
      )
    );
  };

  const applyBulkVariant = () => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.status === "idle" || item.status === "error"
          ? { ...item, variantId: bulkVariantId }
          : item
      )
    );
  };

  const handleUpload = async () => {
    const pendingItems = uploadQueue.filter((item) => item.status !== "success");
    if (pendingItems.length === 0) return;

    setUploading(true);
    setGlobalError("");

    for (const item of pendingItems) {
      // Set status to uploading
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", error: undefined } : q))
      );

      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("alt", item.alt);
      if (item.variantId) formData.set("variantId", item.variantId);

      try {
        const result = await uploadProductImage(productId, formData);
        if (result.error) {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: result.error } : q))
          );
        } else {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q))
          );
        }
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: err.message || "Upload failed" } : q))
        );
      }
    }

    setUploading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Images</h3>

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
          JPG, PNG, WebP, AVIF • Max 5MB per image • You can select multiple files
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Bulk Alt Text
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe these images..."
                    value={bulkAlt}
                    onChange={(e) => setBulkAlt(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E]"
                  />
                  <button
                    type="button"
                    onClick={applyBulkAlt}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>
              </div>

              {variants.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bulk Variant Link
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={bulkVariantId}
                      onChange={(e) => setBulkVariantId(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E]"
                    >
                      <option value="">No variant (general image)</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.attributes}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={applyBulkVariant}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all"
              >
                {/* Info / Preview */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.preview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200"
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

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-[380px] flex-shrink-0">
                  <div>
                    <input
                      type="text"
                      placeholder="SEO Alt Text"
                      value={item.alt}
                      disabled={item.status === "uploading" || item.status === "success"}
                      onChange={(e) => {
                        setUploadQueue((prev) =>
                          prev.map((q) =>
                            q.id === item.id ? { ...q, alt: e.target.value } : q
                          )
                        );
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  {variants.length > 0 && (
                    <div>
                      <select
                        value={item.variantId}
                        disabled={item.status === "uploading" || item.status === "success"}
                        onChange={(e) => {
                          setUploadQueue((prev) =>
                            prev.map((q) =>
                              q.id === item.id ? { ...q, variantId: e.target.value } : q
                            )
                          );
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">No variant</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.attributes}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

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


