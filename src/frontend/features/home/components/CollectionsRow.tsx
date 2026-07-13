
// src/features/home/components/CollectionsRow.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const collections = [
  {
    id: 'festive-fits',
    name: 'Festive Fits',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/photo_6332416038410063602_w.jpg',
    link: '/collections/festive-fits',
    items: 12,
  },
  {
    id: 'rooted-style',
    name: 'Rooted Style',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/IMG_4355-scaled.jpg',
    link: '/collections/rooted-style',
    items: 8,
  },
  {
    id: 'urban-ethnic',
    name: 'Urban Ethnic',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/IMG_5519-scaled.jpg',
    link: '/collections/urban-ethnic',
    items: 10,
  },
  {
    id: 'saree-studio',
    name: 'Saree Studio',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/SL-08-5-scaled.jpg',
    link: '/collections/saree-studio',
    items: 15,
  },
  {
    id: 'wedding-wardrobe',
    name: 'Wedding Wardrobe',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/MEET9590-scaled.jpg',
    link: '/collections/wedding-wardrobe',
    items: 9,
  },
];

interface CollectionsRowProps {
  items?: typeof collections | null;
}

export default function CollectionsRow({ items }: CollectionsRowProps) {
  const activeCollections = items && items.length > 0 ? items : collections;
  const [active, setActive] = useState(activeCollections[0]?.id || 'festive-fits');

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-10 mb-8 max-md:mb-4">
      <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
        {activeCollections.map((col) => (
          <Link
            key={col.id}
            href={col.link}
            onClick={() => setActive(col.id)}
            className={`flex flex-col items-center group transition-all duration-300 ${
              active === col.id ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 p-0.5 transition-all duration-300 ${
                active === col.id ? 'border-[#A0463E] ring-2 ring-[#A0463E]/20' : 'border-gray-200'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 80px, 110px"
                />
              </div>
            </div>
            <span
              className={`mt-3 text-[11px] md:text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                active === col.id ? 'text-[#A0463E]' : 'text-gray-600'
              }`}
            >
              {col.name}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              {col.items} items
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}


