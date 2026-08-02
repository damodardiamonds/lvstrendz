"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface RetryPaymentProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
}

export default function RetryPayment({
  orderId,
}: RetryPaymentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayNow = async () => {
    setIsSubmitting(true);
    toast.loading("Initiating PayGlocal payment gateway...", { id: "retry-pg" });
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        toast.success("Redirecting to PayGlocal secure gateway...", { id: "retry-pg" });
        window.location.href = data.redirectUrl;
      } else {
        toast.dismiss("retry-pg");
        toast.error(data.error || "Failed to initiate PayGlocal payment gateway. Please try again.");
      }
    } catch (err: any) {
      toast.dismiss("retry-pg");
      toast.error(err.message || "Failed to connect to payment gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handlePayNow}
      disabled={isSubmitting}
      className="w-full bg-[#A0463E] hover:bg-black disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
    >
      {isSubmitting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Redirecting to PayGlocal...</span>
        </>
      ) : (
        <span>Pay Now via PayGlocal</span>
      )}
    </button>
  );
}
