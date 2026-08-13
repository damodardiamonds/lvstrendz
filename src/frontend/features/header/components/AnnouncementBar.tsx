'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnnouncementSettings {
  isActive: boolean;
  text: string;
  couponCode: string;
  showCoupon: boolean;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
  textColor: string;
}

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    isActive: true,
    text: "Flat 20% OFF! Use Code:",
    couponCode: "FLAT20",
    showCoupon: true,
    buttonText: "Shop Now",
    buttonLink: "/shop",
    bgColor: "#A0463E",
    textColor: "#FFFFFF",
  });

  useEffect(() => {
    // 1. Fetch announcement settings
    fetch('/api/announcement-bar')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.announcement) {
          setAnnouncement(data.announcement);
        }
      })
      .catch((err) => console.error('Failed to fetch announcement settings:', err));

    // 2. Fetch active coupon if no custom coupon set or to keep coupon code fresh
    fetch('/api/coupons/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.coupon) {
          setAnnouncement((prev) => ({
            ...prev,
            couponCode: prev.couponCode || data.coupon.code,
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch active coupon:', err));
  }, []);

  if (!visible || !announcement.isActive) return null;

  const bgColor = announcement.bgColor || "#A0463E";
  const textColor = announcement.textColor || "#FFFFFF";
  const buttonLink = announcement.buttonLink || "/shop";
  const buttonText = announcement.buttonText || "Shop Now";

  return (
    <div
      className="relative transition-colors duration-200"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-center px-4">
        <p className="text-[12px] font-medium tracking-wide sm:text-[13px] text-center flex items-center justify-center flex-wrap gap-1 sm:gap-1.5">
          <span>{announcement.text}</span>
          {announcement.showCoupon && announcement.couponCode && (
            <span
              className="inline-block rounded border px-2 py-0.5 font-bold uppercase text-xs"
              style={{ borderColor: `${textColor}66` }}
            >
              {announcement.couponCode}
            </span>
          )}
          {buttonText && (
            <Link
              href={buttonLink}
              className="ml-1 underline underline-offset-2 hover:opacity-80 transition-opacity font-semibold"
            >
              {buttonText}
            </Link>
          )}
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity p-1"
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

