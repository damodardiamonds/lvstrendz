
"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "../actions";

interface DeleteButtonProps {
  productId: string;
  productName: string;
}

export default function DeleteButton({ productId, productName }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteProduct(productId);
    setShowConfirm(false);
    setDeleting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Product
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-medium">&quot;{productName}&quot;</span>?
              This will also delete all variants and images. This action cannot
              be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

