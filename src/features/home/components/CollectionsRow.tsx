
// src/features/home/components/CollectionsRow.tsx
'use client';

import { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';

const collections = [
  {
    id: 'festive-fits',
    name: 'Festive Fits',
    image: 'lvstrendz/products/festive-fits',
    link: '/collections/festive-fits',
    items: 12,
  },
  {
    id: 'rooted-style',
    name: 'Rooted Style',
    image: 'lvstrendz/products/rooted-style',
    link: '/collections/rooted-style',
    items: 8,
  },
  {
    id: 'urban-ethnic',
    name: 'Urban Ethnic',
    image: 'lvstrendz/products/urban-ethnic',
    link: '/collections/urban-ethnic',
    items: 10,
  },
  {
    id: 'saree-studio',
    name: 'Saree Studio',
    image: 'lvstrendz/products/saree-studio',
    link: '/collections/saree-studio',
    items: 15,
  },
  {
    id: 'wedding-wardrobe',
    name: 'Wedding Wardrobe',
    image: 'lvstrendz/products/wedding-wardrobe',
    link: '/collections/wedding-wardrobe',
    items: 9,
  },
];

export default function CollectionsRow() {
  const [active, setActive] = useState('festive-fits');

  return (
    <section className="w-full max-w-[1470px] mx-auto px-[45px] py-[40px] mb-[30px] max-md:px-4 max-md:mb-[20px]">
      <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={col.link}
            onClick={() => setActive(col.id)}
            className={`flex flex-col items-center group transition-opacity ${
              active === col.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 transition-colors ${
                active === col.id ? 'border-[#A0463E]' : 'border-gray-200'
              }`}
            >
              <CldImage
                src={col.image}
                alt={col.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                crop="fill"
                gravity="auto"
              />
            </div>
            <span
              className={`mt-2 text-[11px] md:text-xs font-medium uppercase tracking-wider ${
                active === col.id ? 'text-[#A0463E]' : 'text-gray-500'
              }`}
            >
              {col.name}
            </span>
            <span className="text-[10px] text-gray-400">
              {col.items} items
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

