
"use client";

import { useState } from "react";
import { Trash2, Save } from "lucide-react";
import { updateVariant, deleteVariant } from "../actions";

interface VariantAttribute {
  attributeValue: {
    value: string;
    colorCode: string | null;
    attribute: {
      name: string;
    };
  };
}

interface Variant {
  id: string;
  sku: string | null;
  price: unknown;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  attributes: VariantAttribute[];
}

interface VariantListProps {
  variants: Variant[];
  productId: string;
}

export default function VariantList({ variants, productId }: VariantListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      setDeletingId(variantId);
      await deleteVariant(variantId, productId);
      setDeletingId(null);
    }
  };

  if (variants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          No variants yet. Add one using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Existing Variants ({variants.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Attributes
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                SKU
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Price (₹)
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Stock
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                productId={productId}
                onDelete={handleDelete}
                isDeleting={deletingId === variant.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  productId,
  onDelete,
  isDeleting,
}: {
  variant: Variant;
  productId: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(variant.stock);
  const [price, setPrice] = useState(
    variant.price ? Number(variant.price) : ""
  );
  const [sku, setSku] = useState(variant.sku || "");

  const handleSave = async () => {
    const formData = new FormData();
    formData.set("sku", sku);
    formData.set("price", price.toString());
    formData.set("stock", stock.toString());
    formData.set("isActive", variant.isActive ? "true" : "false");

    await updateVariant(variant.id, productId, formData);
    setEditing(false);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Attributes */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {variant.attributes.map((attr, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
            >
              {attr.attributeValue.colorCode && (
                <span
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: attr.attributeValue.colorCode }}
                />
              )}
              <span className="text-gray-500">
                {attr.attributeValue.attribute.name}:
              </span>
              <span className="font-medium text-gray-700">
                {attr.attributeValue.value}
              </span>
            </span>
          ))}
          {variant.attributes.length === 0 && (
            <span className="text-gray-400 text-xs">No attributes</span>
          )}
        </div>
      </td>

      {/* SKU */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#A0463E] outline-none"
          />
        ) : (
          <span className="text-gray-600">{variant.sku || "—"}</span>
        )}
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
            min="0"
            step="0.01"
            placeholder="Product price"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#A0463E] outline-none"
          />
        ) : (
          <span className="text-gray-900">
            {variant.price ? `₹${Number(variant.price).toLocaleString("en-IN")}` : "—"}
          </span>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            min="0"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#A0463E] outline-none"
          />
        ) : (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              variant.stock === 0
                ? "bg-red-100 text-red-700"
                : variant.stock <= 5
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {variant.stock}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            variant.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {variant.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                title="Save"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setStock(variant.stock);
                  setPrice(variant.price ? Number(variant.price) : "");
                  setSku(variant.sku || "");
                }}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-xs text-[#A0463E] hover:bg-[#A0463E]/10 rounded transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onDelete(variant.id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

