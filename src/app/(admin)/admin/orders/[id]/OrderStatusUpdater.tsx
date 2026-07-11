
"use client";

import { useState } from "react";
import { updateOrderStatus, updatePaymentStatus } from "../actions";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"];

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
}

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: OrderStatusUpdaterProps) {
  const [orderStatus, setOrderStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [saving, setSaving] = useState(false);

  const handleOrderStatusUpdate = async () => {
    setSaving(true);
    await updateOrderStatus(orderId, orderStatus as never);
    setSaving(false);
  };

  const handlePaymentStatusUpdate = async () => {
    setSaving(true);
    await updatePaymentStatus(orderId, paymentStatus as never);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Update Status</h3>

      {/* Order Status */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Status
        </label>
        <div className="flex gap-2">
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleOrderStatusUpdate}
            disabled={saving || orderStatus === currentStatus}
            className="px-3 py-2 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "..." : "Update"}
          </button>
        </div>
      </div>

      {/* Payment Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Status
        </label>
        <div className="flex gap-2">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handlePaymentStatusUpdate}
            disabled={saving || paymentStatus === currentPaymentStatus}
            className="px-3 py-2 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

