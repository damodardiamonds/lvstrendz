
"use client";

import { useState } from "react";
import { Trash2, Star, GripVertical } from "lucide-react";
import { deleteProductImage, updateImageOrder, updateImageVariant } from "../actions";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  variantId: string | null;
}

interface ImageGridProps {
  images: ProductImage[];
  productId: string;
  variants: { id: string; attributes: string }[];
}

export default function ImageGrid({ images, productId, variants }: ImageGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [orderedImages, setOrderedImages] = useState(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [updatingVariantImageId, setUpdatingVariantImageId] = useState<string | null>(null);

  const handleDelete = async (imageId: string) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeletingId(imageId);
    await deleteProductImage(imageId, productId);
    setOrderedImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletingId(null);
  };

  const handleVariantChange = async (imageId: string, val: string | null) => {
    setUpdatingVariantImageId(imageId);
    await updateImageVariant(imageId, productId, val);
    setOrderedImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, variantId: val } : img))
    );
    setUpdatingVariantImageId(null);
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

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setReordering(true);
    const imageIds = orderedImages.map((img) => img.id);
    await updateImageOrder(productId, imageIds);
    setReordering(false);
  };

  const orderChanged =
    JSON.stringify(orderedImages.map((i) => i.id)) !==
    JSON.stringify(images.map((i) => i.id));

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          No images uploaded yet. Use the uploader above to add images.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Product Images ({orderedImages.length})
        </h3>
        {orderChanged && (
          <button
            onClick={saveOrder}
            disabled={reordering}
            className="px-3 py-1.5 bg-[#A0463E] text-white text-xs font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
          >
            {reordering ? "Saving..." : "Save Order"}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Drag images to reorder. First image is the main product image.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {orderedImages.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group rounded-lg border-2 overflow-hidden cursor-move transition-all ${
              draggedIndex === index
                ? "border-[#A0463E] opacity-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Main Image Badge */}
            {index === 0 && (
              <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-[#A0463E] text-white text-[10px] font-medium rounded flex items-center gap-0.5">
                <Star size={10} fill="white" />
                Main
              </div>
            )}

            {/* Drag Handle */}
            <div className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={14} className="text-gray-500" />
            </div>

            {/* Image */}
            <div className="aspect-square">
              <img
                src={image.url}
                alt={image.alt || "Product image"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pb-8 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Link to Variant Selector */}
            {variants.length > 0 && (
              <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100">
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

