'use client';

import { useRef, useState, useEffect } from 'react';
import type { ProductForHome } from '@/lib/products';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductSliderProps {
  products: ProductForHome[];
  title: string;
}

export default function ProductSlider({ products, title }: ProductSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 5);
      // Allow some tolerance for rounding issues
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      // Check initial state
      checkScroll();
      // Re-check on window resize
      window.addEventListener('resize', checkScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      // Scroll by half the container width (equivalent to one card on mobile)
      const scrollAmount = direction === 'left' ? -(container.clientWidth / 2) : (container.clientWidth / 2);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      {/* Header Row */}
      <div className="mb-[30px] border-b border-gray-200 pb-3 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-black uppercase tracking-wide">
            {title}
          </h2>
          <div className="h-[2px] bg-[#A0463E] w-24 mt-1" />
        </div>

        {/* Slide Arrows (visible on mobile only if there are more than 2 products) */}
        {products.length > 2 && (
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                canScrollLeft
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100'
                  : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                canScrollRight
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100'
                  : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Static Grid, Mobile: Horizontal Scrollable Slider */}
      <div>
        {/* Desktop View (4 columns) */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {/* Mobile View (Horizontal single row scrollable list of 2 products) */}
        <div
          ref={scrollContainerRef}
          className="md:hidden flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="w-[calc(50%-8px)] shrink-0 snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
