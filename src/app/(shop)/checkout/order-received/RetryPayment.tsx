"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface RetryPaymentProps {
  orderId: string;
}

export default function RetryPayment({ orderId }: RetryPaymentProps) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        toast.success("Redirecting to secure payment page...", {
          style: { background: "#1a4223", color: "#fff" },
        });
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || "Unable to initiate payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment. Please try again.", {
        style: { background: "#3D1515", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing Secure Redirect...
        </>
      ) : (
        "Pay Now"
      )}
    </button>
  );
}
