
// src/features/home/components/CollectionsRow.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const collections = [
  {
    id: 'featured-fit',
    name: 'Featured Fit',
    image: '/images/collections/featured-fit.jpg',
    link: '/collections/featured-fit',
  },
  {
    id: 'boosted-style',
    name: 'Boosted Style',
    image: '/images/collections/boosted-style.jpg',
    link: '/collections/boosted-style',
  },
  {
    id: 'urban-ethnic',
    name: 'Urban Ethnic',
    image: '/images/collections/urban-ethnic.jpg',
    link: '/collections/urban-ethnic',
  },
];

export default function CollectionsRow() {
  const [active, setActive] = useState('featured-fit');

  return (
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[50px] max-md:px-4 max-md:mb-[30px]">
      <div className="flex justify-center gap-6 md:gap-10">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={col.link}
            onClick={() => setActive(col.id)}
            className={`flex flex-col items-center group transition-opacity ${
              active === col.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 transition-colors ${
                active === col.id ? 'border-[#A0463E]' : 'border-gray-200'
              }`}
            >
              <Image
                src={col.image}
                alt={col.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`mt-2 text-[11px] md:text-xs font-medium uppercase tracking-wider ${
                active === col.id ? 'text-[#A0463E]' : 'text-gray-500'
              }`}
            >
              {col.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

