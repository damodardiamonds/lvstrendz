
"use client";

import { useEffect, useState } from "react";

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
  metaTitle: string | null;
  metaDescription: string | null;
}

interface ProductFormProps {
  product?: ProductData;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export default function ProductForm({
  product,
  action,
  submitLabel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!product);

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

  return (
    <form action={action} className="space-y-8">
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
              defaultValue={product?.shortDescription || ""}
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
              defaultValue={product?.description || ""}
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
              defaultValue={product?.price || ""}
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
              defaultValue={product?.compareAtPrice || ""}
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
              defaultValue={product?.costPrice || ""}
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
              defaultValue={product?.sku || ""}
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
              defaultValue={product?.weight || ""}
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
              defaultValue={product?.metaTitle || ""}
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
              defaultValue={product?.metaDescription || ""}
              rows={2}
              placeholder="Brief description for search results"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition resize-y"
            />
          </div>
        </div>
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
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#A0463E] text-white font-medium rounded-lg hover:bg-[#8a3b34] transition-colors"
        >
          {submitLabel}
        </button>
        <a
          href="/admin/products"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

