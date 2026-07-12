
// src/features/header/components/AnnouncementBar.tsx
'use client';

import { useState } from 'react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="w-full bg-[#A0463E] text-white text-center py-2.5 px-4 relative">
      <p className="text-xs md:text-sm font-medium tracking-wide">
        Enjoy 20% OFF on all Ethnic Wear! Use Code: <span className="font-bold">SAVE</span>
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
  );
}

