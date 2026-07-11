
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createVariant } from "../actions";

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: {
    id: string;
    value: string;
    slug: string;
    colorCode: string | null;
    sortOrder: number;
  }[];
}

interface AddVariantFormProps {
  productId: string;
  attributes: Attribute[];
}

export default function AddVariantForm({
  productId,
  attributes,
}: AddVariantFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  const handleSubmit = async (formData: FormData) => {
    // Add selected attribute value IDs
    Object.values(selectedAttributes).forEach((valueId) => {
      if (valueId) {
        formData.append("attributeValueIds", valueId);
      }
    });

    await createVariant(productId, formData);
    setIsOpen(false);
    setSelectedAttributes({});
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors"
        >
          <Plus size={18} />
          Add Variant
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Add New Variant
      </h3>
      <form action={handleSubmit} className="space-y-4">
        {/* Attribute Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {attributes.map((attr) => (
            <div key={attr.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.name}
              </label>
              <select
                value={selectedAttributes[attr.id] || ""}
                onChange={(e) =>
                  setSelectedAttributes((prev) => ({
                    ...prev,
                    [attr.id]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
              >
                <option value="">Select {attr.name}</option>
                {attr.values.map((val) => (
                  <option key={val.id} value={val.id}>
                    {val.value}
                    {val.colorCode ? ` (${val.colorCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* SKU, Price, Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant SKU
            </label>
            <input
              type="text"
              name="sku"
              placeholder="LVS-SAR-001-RED-M"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Override (₹)
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              placeholder="Leave blank to use product price"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              defaultValue={0}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors"
          >
            Add Variant
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSelectedAttributes({});
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

