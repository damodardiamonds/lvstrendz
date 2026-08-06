"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "../actions";

interface DeleteOrderButtonProps {
  orderId: string;
  orderNumber: string;
  redirectToOrders?: boolean;
  variant?: "icon" | "button";
}

export default function DeleteOrderButton({
  orderId,
  orderNumber,
  redirectToOrders = false,
  variant = "icon",
}: DeleteOrderButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOrder(orderId);
      setShowConfirm(false);
      if (redirectToOrders) {
        router.push("/admin/orders");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete order. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete Order"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={14} />
          Delete Order
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Order
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete order{" "}
              <span className="font-medium">#{orderNumber}</span>? This action
              cannot be undone.
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
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
