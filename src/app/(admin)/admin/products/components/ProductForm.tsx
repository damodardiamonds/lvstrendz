"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AlertCircle, Upload, Image as ImageIcon, Trash2, Plus, X, GripVertical } from "lucide-react";

function SubmitButton({ label, isSubmitting }: { label: string; isSubmitting?: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-6 py-2.5 bg-[#A0463E] text-white font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-60 flex items-center gap-2"
    >
      {isSubmitting && (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      )}
      {isSubmitting ? "Saving..." : label}
    </button>
  );
}

interface ProductData {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  weight: number | null;
  displayAttributes?: string[];
  selectedColorIds?: string[];
  selectedSizeIds?: string[];
  images?: { id: string; url: string; alt: string | null; colorId?: string | null }[];
  metaTitle: string | null;
  metaDescription: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ColorOption {
  id: string;
  value: string;
  colorCode: string | null;
}

interface SizeOption {
  id: string;
  value: string;
}

interface ProductFormProps {
  product?: ProductData;
  selectedCategoryIds?: string[];
  categories?: CategoryOption[];
  availableColors?: ColorOption[];
  availableSizes?: SizeOption[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
}

export default function ProductForm({
  product,
  selectedCategoryIds = [],
  categories = [],
  availableColors = [],
  availableSizes = [],
  action,
  submitLabel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!product);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategoryIds);
  const [displayAttrs, setDisplayAttrs] = useState<string[]>(
    product?.displayAttributes ?? ["size", "color"]
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    product?.selectedColorIds ?? []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    product?.selectedSizeIds ?? []
  );
  const [uploadQueue, setUploadQueue] = useState<{ id: string; file: File; preview: string; alt: string; colorId: string }[]>([]);
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: { id: string; file: File; preview: string; alt: string; colorId: string }[] = [];
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
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
      });
    });
    if (errors.length > 0) {
      setError(errors.join(". "));
    }
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveQueuedImage = (id: string) => {
    const item = uploadQueue.find((q) => q.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }, [name, autoSlug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await action(formData);
      if (res && res.error) {
        setError(res.error);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
        return;
      }
      console.error("Product action error:", err);
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Could not save product</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Banarasi Silk Saree"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                required
                placeholder="banarasi-silk-saree"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
              />
              {!autoSlug && (
                <button
                  type="button"
                  onClick={() => setAutoSlug(true)}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Auto
                </button>
              )}
            </div>
          </div>

          {/* Short Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              defaultValue={product?.shortDescription ?? ""}
              placeholder="Brief one-liner about the product"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              rows={4}
              placeholder="Detailed product description..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition resize-y"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              defaultValue={product?.price ?? ""}
              required
              min="0"
              step="0.01"
              placeholder="1999.00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price (₹)
            </label>
            <input
              type="number"
              name="compareAtPrice"
              defaultValue={product?.compareAtPrice ?? ""}
              min="0"
              step="0.01"
              placeholder="2499.00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price (₹)
            </label>
            <input
              type="number"
              name="costPrice"
              defaultValue={product?.costPrice ?? ""}
              min="0"
              step="0.01"
              placeholder="1200.00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              defaultValue={product?.sku ?? ""}
              placeholder="LVS-SAR-001"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stock"
              defaultValue={product?.stock ?? 0}
              min="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Alert
            </label>
            <input
              type="number"
              name="lowStockAlert"
              defaultValue={product?.lowStockAlert ?? 5}
              min="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (grams)
            </label>
            <input
              type="number"
              name="weight"
              defaultValue={product?.weight ?? ""}
              min="0"
              step="0.01"
              placeholder="500"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              name="metaTitle"
              defaultValue={product?.metaTitle ?? ""}
              placeholder="Product title for search engines"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              name="metaDescription"
              defaultValue={product?.metaDescription ?? ""}
              rows={2}
              placeholder="Brief description for search results"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition resize-y"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Product Categories
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Select one or more categories for this product
        </p>

        {/* Selected Badges */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            {selectedIds.map((id) => {
              const cat = categories.find((c) => c.id === id);
              if (!cat) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A0463E] text-white text-xs font-semibold rounded-full shadow-sm"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(id)}
                    className="hover:text-gray-200 ml-1 font-bold text-sm leading-none focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search & Checklist */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
          />

          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 p-1 bg-white">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No categories found.
              </p>
            ) : (
              filteredCategories.map((cat) => {
                const isChecked = selectedIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Hidden Inputs for Standard Form Action */}
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="categoryIds" value={id} />
        ))}
      </div>

      {/* Product Attributes / Selectors to Display */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Product Attributes (Selectors on Store Page)
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Select which attribute options and specific values should be displayed for customers on the product page.
          </p>

          <div className="flex flex-wrap gap-6 bg-gray-50 p-4 rounded-lg border border-gray-150">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="displayAttributes"
                value="size"
                checked={displayAttrs.includes("size")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDisplayAttrs([...displayAttrs, "size"]);
                  } else {
                    setDisplayAttrs(displayAttrs.filter((a) => a !== "size"));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
              />
              <span className="text-sm font-medium text-gray-800">
                Size Selector <span className="text-xs text-gray-500 font-normal">(S, M, L, XL, XXL)</span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="displayAttributes"
                value="color"
                checked={displayAttrs.includes("color")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDisplayAttrs([...displayAttrs, "color"]);
                  } else {
                    setDisplayAttrs(displayAttrs.filter((a) => a !== "color"));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
              />
              <span className="text-sm font-medium text-gray-800">
                Color Selector <span className="text-xs text-gray-500 font-normal">(Swatches / Options)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Specific Color Selection */}
        {displayAttrs.includes("color") && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Select Product Available Colors ({selectedColors.length} selected)
                </h3>
                <p className="text-xs text-gray-500">
                  Choose specific colors available for this product
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColors(availableColors.map((c) => c.id))}
                  className="text-xs text-[#A0463E] hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedColors([])}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {availableColors.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                No store colors found. You can add store colors under Admin → Attributes.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
                {availableColors.map((color) => {
                  const isSelected = selectedColors.includes(color.id);
                  return (
                    <label
                      key={color.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        isSelected
                          ? "bg-[#A0463E]/10 border-[#A0463E] font-medium"
                          : "bg-white border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedColors(selectedColors.filter((id) => id !== color.id));
                          } else {
                            setSelectedColors([...selectedColors, color.id]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 shrink-0 shadow-sm"
                        style={{ backgroundColor: color.colorCode || "#CCC" }}
                      />
                      <span className="text-xs text-gray-800 line-clamp-1">
                        {color.value}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Specific Size Selection */}
        {displayAttrs.includes("size") && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Select Product Available Sizes ({selectedSizes.length} selected)
                </h3>
                <p className="text-xs text-gray-500">
                  Choose specific sizes available for this product
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSizes(availableSizes.map((s) => s.id))}
                  className="text-xs text-[#A0463E] hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedSizes([])}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {availableSizes.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                No store sizes found. You can add store sizes under Admin → Attributes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSizes.includes(sz.id);
                  return (
                    <label
                      key={sz.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-all text-xs ${
                        isSelected
                          ? "bg-[#A0463E] text-white border-[#A0463E] font-bold"
                          : "bg-white border-gray-200 hover:bg-gray-100 text-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedSizes(selectedSizes.filter((id) => id !== sz.id));
                          } else {
                            setSelectedSizes([...selectedSizes, sz.id]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
                      />
                      <span>{sz.value}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Hidden inputs for Form Action */}
        {selectedColors.map((id) => (
          <input key={id} type="hidden" name="selectedColorIds" value={id} />
        ))}
        {selectedSizes.map((id) => (
          <input key={id} type="hidden" name="selectedSizeIds" value={id} />
        ))}
      </div>

      {/* Product Images & Color Assignment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Product Images & Color Mapping
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Upload images for this product and assign which color each image belongs to. When a customer clicks a color on the product page, the matching images will be displayed!
          </p>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-[#A0463E] hover:bg-gray-50/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <Upload size={28} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              Click to upload product images or drag & drop
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
                if (e.target.files && e.target.files.length > 0) {
                  handleAddFiles(e.target.files);
                }
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Upload Queue List */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Queued Images to Upload ({uploadQueue.length} files - Drag to reorder)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {uploadQueue.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleQueueDragStart(idx)}
                  onDragOver={(e) => handleQueueDragOver(e, idx)}
                  onDragEnd={handleQueueDragEnd}
                  className={`p-3 bg-gray-50 border rounded-xl flex items-center gap-3 relative cursor-grab active:cursor-grabbing transition-all ${
                    draggedQueueIndex === idx
                      ? "opacity-40 border-dashed border-[#A0463E]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <GripVertical size={16} className="text-gray-400 shrink-0" />
                  <img
                    src={item.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0 pointer-events-none"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {item.file.name}
                    </p>
                    <input
                      type="text"
                      placeholder="SEO Alt text..."
                      value={item.alt}
                      onChange={(e) => {
                        const newAlt = e.target.value;
                        setUploadQueue((prev) =>
                          prev.map((q) => (q.id === item.id ? { ...q, alt: newAlt } : q))
                        );
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#A0463E]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-gray-600 shrink-0">Color:</span>
                      <select
                        value={item.colorId}
                        onChange={(e) => {
                          const newColorId = e.target.value;
                          setUploadQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, colorId: newColorId } : q))
                          );
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#A0463E]"
                      >
                        <option value="">All Colors (Default Image)</option>
                        {availableColors.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.value} ({col.colorCode || "No Hex"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQueuedImage(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded self-start"
                    title="Remove image"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Hidden inputs to pass Files, alts & colorIds to Server Action */}
                  <input
                    type="file"
                    name="files"
                    className="hidden"
                    ref={(inputRef) => {
                      if (inputRef) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(item.file);
                        inputRef.files = dataTransfer.files;
                      }
                    }}
                  />
                  <input type="hidden" name="alts" value={item.alt} />
                  <input type="hidden" name="colorIds" value={item.colorId} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Images preview (if editing) */}
        {product?.images && product.images.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Existing Product Images ({product.images.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {product.images.map((img) => {
                const assignedColor = availableColors.find((c) => c.id === img.colorId);
                return (
                  <div key={img.id} className="relative group bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                    <img
                      src={img.url}
                      alt={img.alt || "Product image"}
                      className="w-full h-24 object-cover rounded-md mb-2 border border-gray-200"
                    />
                    <span className="block text-[10px] font-medium text-gray-600 truncate">
                      {assignedColor ? (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: assignedColor.colorCode || "#CCC" }}
                          />
                          {assignedColor.value}
                        </span>
                      ) : (
                        "All Colors"
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Note: To reorder, remove, or change assigned colors of existing images, click &quot;Manage Images&quot; under Product Edit Quick Links.
            </p>
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Visibility
        </h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="hidden"
              name="isActive"
              value="false"
            />
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={product?.isActive ?? true}
              className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
            />
            <span className="text-sm text-gray-700">Active (visible on store)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="hidden"
              name="isFeatured"
              value="false"
            />
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={product?.isFeatured ?? false}
              className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E]"
            />
            <span className="text-sm text-gray-700">Featured product</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <SubmitButton label={submitLabel} isSubmitting={isSubmitting} />
        <Link
          href="/admin/products"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

