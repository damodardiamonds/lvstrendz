
"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadProductImage } from "../actions";

interface ImageUploaderProps {
  productId: string;
  variants: { id: string; attributes: string }[];
}

export default function ImageUploader({ productId, variants }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [variantId, setVariantId] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, WebP, and AVIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("alt", alt);
    if (variantId) formData.set("variantId", variantId);

    const result = await uploadProductImage(productId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setAlt("");
      setVariantId("");
    }
    setUploading(false);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setAlt("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Image</h3>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!preview ? (
        /* Drop Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-[#A0463E] bg-[#A0463E]/5"
              : "border-gray-300 hover:border-[#A0463E] hover:bg-gray-50"
          }`}
        >
          <Upload size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Drag & drop an image here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, WebP, AVIF • Max 5MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </div>
      ) : (
        /* Preview & Options */
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={clearSelection}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (for SEO)
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
              />
            </div>
            {variants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Variant (optional)
                </label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                >
                  <option value="">No variant (general image)</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.attributes}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>
      )}
    </div>
  );
}

