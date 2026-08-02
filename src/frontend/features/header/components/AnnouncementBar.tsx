'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      ? `Flat ${coupon.value}% OFF!`
      : `Flat ₹${coupon.value} OFF!`
    : 'Flat 20% OFF!';

  const codeDisplay = coupon ? coupon.code : 'FLAT20';

  return (
    <div className="bg-[#A0463E] text-white relative">
      <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-center px-4">
        <p className="text-[12px] font-medium tracking-wide sm:text-[13px] text-center">
          {offerText} Use Code:{" "}
          <span className="inline-block rounded border border-white/40 px-2 py-0.5 font-bold mx-1 uppercase">
            {codeDisplay}
          </span>{" "}
          <Link
            href="/shop"
            className="ml-2 underline underline-offset-2 hover:text-white/80"
          >
            Shop Now
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
          aria-label="Close announcement"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
