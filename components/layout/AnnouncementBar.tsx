
"use client";

import { useState } from "react";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-[#A0463E] text-white text-center py-2 px-4 text-sm relative">
      <p className="font-medium">
        ✨ Free Shipping on All Orders | Use Code <span className="font-bold">FLAT20</span> for 20% Off ✨
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

