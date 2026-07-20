"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import PaymentModal from "../PaymentModal";

interface RetryPaymentProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
}

export default function RetryPayment({
  orderId,
  orderNumber,
  totalAmount,
  customerEmail,
}: RetryPaymentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
      >
        Pay Now
      </button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        totalAmount={totalAmount}
        customerEmail={customerEmail}
      />
    </>
  );
}
