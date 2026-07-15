
// src/features/home/components/CollectionsRow.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
      window.addEventListener('resize', checkScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [activeCollections]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -(container.clientWidth / 2) : (container.clientWidth / 2);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-8 mb-8 max-md:mb-4">
      {/* Desktop view: static grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 md:gap-6">
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
                sizes="20vw"
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

      {/* Mobile view: horizontal scrollable slider */}
      <div className="md:hidden relative">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className={`absolute left-2 top-[35%] -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white/95 shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className={`absolute right-2 top-[35%] -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white/95 shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {activeCollections.map((col) => (
            <Link
              key={col.id}
              href={col.link}
              onClick={() => setActive(col.id)}
              className={`w-[calc(50%-8px)] shrink-0 snap-start flex flex-col items-center group transition-all duration-300 ${
                active === col.id ? 'opacity-100 scale-[1.01]' : 'opacity-90 hover:opacity-100'
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
                  sizes="50vw"
                />
              </div>
              <span
                className={`mt-3 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  active === col.id ? 'text-[#A0463E]' : 'text-gray-800'
                }`}
              >
                {col.name}
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">
                {col.items} items
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}



