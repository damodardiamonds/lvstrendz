"use client";

import { useState } from "react";
import { X, Search, Check, AlertCircle } from "lucide-react";
import { quickUpdateProduct } from "../actions";

interface CategoryOption {
  id: string;
  name: string;
}

interface QuickEditProduct {
  id: string;
  name: string;
  sku: string | null;
  price: unknown;
  categories: { category: { id: string; name: string } }[];
}

interface QuickEditModalProps {
  product: QuickEditProduct;
  allCategories: CategoryOption[];
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickEditModal({
  product,
  allCategories,
  isOpen,
  onClose,
}: QuickEditModalProps) {
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku || "");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product.categories.map((c) => c.category.id)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    if (!name.trim()) {
      setError("Product title is required");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      await quickUpdateProduct(product.id, {
        name,
        sku,
        price: parsedPrice,
        categoryIds: selectedCategoryIds,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Quick Edit Product</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-150">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]/20 focus:border-[#A0463E]"
              placeholder="e.g. Navratri Special Lehenga Choli"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]/20 focus:border-[#A0463E]"
                placeholder="e.g. RAM-120"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]/20 focus:border-[#A0463E]"
                  placeholder="3499"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Categories ({selectedCategoryIds.length} selected)
              </label>
            </div>

            {allCategories.length > 5 && (
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#A0463E]"
                />
              </div>
            )}

            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-[#A0463E]/10 text-[#A0463E]"
                          : "hover:bg-gray-200/60 text-gray-700"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isChecked && <Check size={14} className="text-[#A0463E]" />}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 p-2 text-center">
                  No categories found
                </p>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-[#A0463E] text-white rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
