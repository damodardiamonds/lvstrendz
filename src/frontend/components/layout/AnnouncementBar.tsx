"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    text: "✨ Free Shipping on All Orders | Use Code",
    couponCode: "FLAT20",
    showCoupon: true,
    buttonText: "Shop Now",
    buttonLink: "/shop",
    bgColor: "#A0463E",
    textColor: "#FFFFFF",
  });

  useEffect(() => {
    fetch('/api/announcement-bar')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.announcement) {
          setAnnouncement(data.announcement);
        }
      })
      .catch((err) => console.error('Failed to fetch announcement settings:', err));

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
      className="relative text-center py-2 px-4 text-sm font-medium transition-colors duration-200"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <p className="flex items-center justify-center flex-wrap gap-1 sm:gap-2">
        <span>{announcement.text}</span>
        {announcement.showCoupon && announcement.couponCode && (
          <span className="font-bold uppercase tracking-wider">{announcement.couponCode}</span>
        )}
        {buttonText && (
          <Link href={buttonLink} className="underline underline-offset-2 ml-1 font-semibold hover:opacity-80">
            {buttonText}
          </Link>
        )}
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 p-1"
        aria-label="Close announcement"
      >
        ✕
      </button>
    </div>
  );
}
