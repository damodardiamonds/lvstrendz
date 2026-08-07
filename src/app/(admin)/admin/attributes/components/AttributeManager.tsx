"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Palette, Ruler } from "lucide-react";
import {
  addColorValue,
  addSizeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from "../actions";

interface AttributeValueItem {
  id: string;
  value: string;
  slug: string;
  colorCode: string | null;
  sortOrder: number;
}

interface AttributeGroup {
  id: string;
  name: string;
  slug: string;
  values: AttributeValueItem[];
}

interface AttributeManagerProps {
  attributes: AttributeGroup[];
}

export default function AttributeManager({ attributes }: AttributeManagerProps) {
  const colorAttr = attributes.find((a) => a.slug === "color") || {
    id: "color",
    name: "Color",
    slug: "color",
    values: [],
  };

  const sizeAttr = attributes.find((a) => a.slug === "size") || {
    id: "size",
    name: "Size",
    slug: "size",
    values: [],
  };

  // Color Add Form State
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#A0463E");
  const [addingColor, setAddingColor] = useState(false);

  // Size Add Form State
  const [newSizeName, setNewSizeName] = useState("");
  const [addingSize, setAddingSize] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editColorCode, setEditColorCode] = useState("#000000");
  const [submitting, setSubmitting] = useState(false);

  // Add Color Handler
  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;
    setSubmitting(true);
    try {
      await addColorValue(newColorName, newColorHex);
      setNewColorName("");
      setAddingColor(false);
    } catch (err) {
      console.error("Failed to add color:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add Size Handler
  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;
    setSubmitting(true);
    try {
      await addSizeValue(newSizeName);
      setNewSizeName("");
      setAddingSize(false);
    } catch (err) {
      console.error("Failed to add size:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (id: string, isColor: boolean) => {
    if (!editValue.trim()) return;
    setSubmitting(true);
    try {
      await updateAttributeValue(id, editValue, isColor ? editColorCode : null);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update attribute value:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this attribute value?")) {
      setSubmitting(true);
      try {
        await deleteAttributeValue(id);
      } catch (err) {
        console.error("Failed to delete attribute value:", err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* ================= COLORS SECTION ================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Available Colors</h2>
              <p className="text-xs text-gray-500">
                Manage store colors and hex codes for color swatches ({colorAttr.values.length} colors)
              </p>
            </div>
          </div>

          <button
            onClick={() => setAddingColor(!addingColor)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors"
          >
            <Plus size={16} />
            Add New Color
          </button>
        </div>

        {/* Add Color Form */}
        {addingColor && (
          <form
            onSubmit={handleAddColor}
            className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4"
          >
            <h4 className="text-xs uppercase font-bold text-gray-700 tracking-wider">
              Add Color Attribute
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Color Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Blue, Crimson Red"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hex Color Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded cursor-pointer border border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#A0463E"
                    className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
                >
                  Save Color
                </button>
                <button
                  type="button"
                  onClick={() => setAddingColor(false)}
                  className="px-3 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Colors Grid */}
        {colorAttr.values.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No colors added yet. Click &quot;Add New Color&quot; above to create one.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {colorAttr.values.map((col) => {
              const isEditing = editingId === col.id;
              return (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="color"
                        value={editColorCode}
                        onChange={(e) => setEditColorCode(e.target.value)}
                        className="w-7 h-7 p-0.5 rounded cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={editColorCode}
                        onChange={(e) => setEditColorCode(e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-mono border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => handleSaveEdit(col.id, true)}
                        disabled={submitting}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-full border border-gray-300 shadow-inner shrink-0"
                          style={{ backgroundColor: col.colorCode || "#CCCCCC" }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            {col.value}
                          </p>
                          <span className="text-[11px] font-mono text-gray-500">
                            {col.colorCode || "#—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(col.id);
                            setEditValue(col.value);
                            setEditColorCode(col.colorCode || "#000000");
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit color"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(col.id)}
                          disabled={submitting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete color"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= SIZES SECTION ================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
              <Ruler size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Available Sizes</h2>
              <p className="text-xs text-gray-500">
                Manage size options for clothing, sarees & garments ({sizeAttr.values.length} sizes)
              </p>
            </div>
          </div>

          <button
            onClick={() => setAddingSize(!addingSize)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors"
          >
            <Plus size={16} />
            Add New Size
          </button>
        </div>

        {/* Add Size Form */}
        {addingSize && (
          <form
            onSubmit={handleAddSize}
            className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4"
          >
            <h4 className="text-xs uppercase font-bold text-gray-700 tracking-wider">
              Add Size Attribute
            </h4>
            <div className="flex items-center gap-3 max-w-md">
              <input
                type="text"
                placeholder="e.g. S, M, L, XL, 3XL, Free Size"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                required
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A0463E]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
              >
                Save Size
              </button>
              <button
                type="button"
                onClick={() => setAddingSize(false)}
                className="px-3 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sizes Grid */}
        {sizeAttr.values.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No sizes added yet. Click &quot;Add New Size&quot; above to create one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {sizeAttr.values.map((sz) => {
              const isEditing = editingId === sz.id;
              return (
                <div
                  key={sz.id}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => handleSaveEdit(sz.id, false)}
                        disabled={submitting}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-800 text-sm">
                        {sz.value}
                      </span>
                      <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
                        <button
                          onClick={() => {
                            setEditingId(sz.id);
                            setEditValue(sz.value);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit size"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(sz.id)}
                          disabled={submitting}
                          className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                          title="Delete size"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
