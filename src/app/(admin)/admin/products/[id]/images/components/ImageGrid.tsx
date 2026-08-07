"use client";

import { useState } from "react";
import { Trash2, Star, GripVertical } from "lucide-react";
import { deleteProductImage, deleteProductImages, updateImageOrder, updateImageVariant, updateImageColor } from "../actions";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  variantId: string | null;
  colorId?: string | null;
}

interface ColorOption {
  id: string;
  name: string;
  colorCode: string | null;
}

interface ImageGridProps {
  images: ProductImage[];
  productId: string;
  variants: { id: string; attributes: string }[];
  colors?: ColorOption[];
}

export default function ImageGrid({ images, productId, variants, colors = [] }: ImageGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [orderedImages, setOrderedImages] = useState(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [updatingVariantImageId, setUpdatingVariantImageId] = useState<string | null>(null);
  const [updatingColorImageId, setUpdatingColorImageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleDelete = async (imageId: string) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeletingId(imageId);
    await deleteProductImage(imageId, productId);
    setOrderedImages((prev) => prev.filter((img) => img.id !== imageId));
    setSelectedIds((prev) => prev.filter((id) => id !== imageId));
    setDeletingId(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete the ${selectedIds.length} selected images? This cannot be undone.`)) return;

    setBulkDeleting(true);
    await deleteProductImages(selectedIds, productId);
    setOrderedImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
    setSelectedIds([]);
    setBulkDeleting(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(orderedImages.map((img) => img.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleVariantChange = async (imageId: string, val: string | null) => {
    setUpdatingVariantImageId(imageId);
    await updateImageVariant(imageId, productId, val);
    setOrderedImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, variantId: val } : img))
    );
    setUpdatingVariantImageId(null);
  };

  const handleColorChange = async (imageId: string, val: string | null) => {
    setUpdatingColorImageId(imageId);
    await updateImageColor(imageId, productId, val);
    setOrderedImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, colorId: val } : img))
    );
    setUpdatingColorImageId(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedImages];
    const [dragged] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, dragged);
    setOrderedImages(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    setReordering(true);
    const imageIds = orderedImages.map((img) => img.id);
    await updateImageOrder(productId, imageIds);
    setReordering(false);
  };

  if (orderedImages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No images uploaded yet.</p>
      </div>
    );
  }

  const allSelected = orderedImages.length > 0 && selectedIds.length === orderedImages.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < orderedImages.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Product Images ({orderedImages.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Drag cards to reorder. The first image is the main thumbnail. Assign specific colors to images below!
          </p>
        </div>
        {reordering && (
          <span className="text-xs text-[#A0463E] font-medium animate-pulse">
            Saving order...
          </span>
        )}
      </div>

      {/* Select All & Bulk Delete Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 border border-gray-200/60 rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-1 focus:ring-[#A0463E] cursor-pointer"
          />
          <span>Select All ({selectedIds.length} selected)</span>
        </label>

        {selectedIds.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            <Trash2 size={14} />
            {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {orderedImages.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
              selectedIds.includes(image.id)
                ? "border-[#A0463E] ring-2 ring-[#A0463E]/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Checkbox Overlay */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedIds.includes(image.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds((prev) => [...prev, image.id]);
                  } else {
                    setSelectedIds((prev) => prev.filter((id) => id !== image.id));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-1 focus:ring-[#A0463E] cursor-pointer"
              />
            </div>

            {/* Main Image Badge */}
            {index === 0 && (
              <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-[#A0463E] text-white text-[10px] font-bold rounded flex items-center gap-0.5">
                <Star size={10} fill="white" />
                MAIN
              </div>
            )}

            {/* Image */}
            <div className="aspect-square bg-gray-100">
              <img
                src={image.url}
                alt={image.alt || "Product image"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id);
                }}
                disabled={deletingId === image.id}
                className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Color Link Selector */}
            {colors.length > 0 && (
              <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
                <select
                  value={image.colorId || ""}
                  onChange={(e) => handleColorChange(image.id, e.target.value || null)}
                  disabled={updatingColorImageId === image.id}
                  className="w-full text-[10px] font-medium bg-white border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-[#A0463E] outline-none disabled:opacity-50"
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

            {/* Link to Variant Selector */}
            {variants.length > 0 && (
              <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
                <select
                  value={image.variantId || ""}
                  onChange={(e) => handleVariantChange(image.id, e.target.value || null)}
                  disabled={updatingVariantImageId === image.id}
                  className="w-full text-[10px] font-medium bg-white border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-[#A0463E] outline-none disabled:opacity-50"
                >
                  <option value="">General Image</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.attributes}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Alt text */}
            {image.alt && (
              <div className="px-2 py-1 bg-gray-50 border-t border-gray-200">
                <p className="text-[10px] text-gray-500 truncate">{image.alt}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
