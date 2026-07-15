
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
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-8 mb-8 max-md:mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
        {activeCollections.map((col) => (
          <Link
            key={col.id}
            href={col.link}
            onClick={() => setActive(col.id)}
            className={`flex flex-col items-center group transition-all duration-300 ${
              active === col.id ? 'opacity-100 scale-[1.02]' : 'opacity-85 hover:opacity-100'
            }`}
          >
            <div
              className={`w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 relative shadow-sm ${
                active === col.id ? 'border-[#A0463E]' : 'border-gray-200'
              }`}
            >
              <Image
                src={col.image}
                alt={col.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
            <span
              className={`mt-3 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                active === col.id ? 'text-[#A0463E]' : 'text-gray-800'
              }`}
            >
              {col.name}
            </span>
            <span className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">
              {col.items} items
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}


