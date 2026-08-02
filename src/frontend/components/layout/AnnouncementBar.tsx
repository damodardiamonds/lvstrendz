"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [coupon, setCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

  useEffect(() => {
    fetch('/api/coupons/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.coupon) {
          setCoupon(data.coupon);
        }
      })
      .catch((err) => console.error('Failed to fetch active coupon:', err));
  }, []);

  if (!visible) return null;

  const offerText = coupon
    ? coupon.type === 'PERCENTAGE'
      ? `${coupon.value}% Off`
      : `₹${coupon.value} Off`
    : '20% Off';

  const codeDisplay = coupon ? coupon.code : 'FLAT20';

  return (
    <div className="bg-[#A0463E] text-white text-center py-2 px-4 text-sm relative">
      <p className="font-medium">
        ✨ Free Shipping on All Orders | Use Code <span className="font-bold uppercase">{codeDisplay}</span> for {offerText} ✨
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
        aria-label="Close announcement"
      >
        ✕
      </button>
    </div>
  );
}
