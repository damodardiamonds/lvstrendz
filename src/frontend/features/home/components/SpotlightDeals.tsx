
'use client';

// src/frontend/features/home/components/SpotlightDeals.tsx
import { useRef, useState, useEffect } from 'react';
import type { ProductForHome } from '@/lib/products';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SpotlightDealsProps {
  spotlight: ProductForHome[];
  newArrivals: ProductForHome[];
}

export function SpotlightDeals({ spotlight, newArrivals }: SpotlightDealsProps) {
  const newArrivalsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftNA, setCanScrollLeftNA] = useState(false);
  const [canScrollRightNA, setCanScrollRightNA] = useState(true);

  const checkScrollNA = () => {
    const container = newArrivalsScrollRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeftNA(scrollLeft > 5);
      setCanScrollRightNA(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = newArrivalsScrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollNA, { passive: true });
      checkScrollNA();
      window.addEventListener('resize', checkScrollNA, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollNA);
      }
      window.removeEventListener('resize', checkScrollNA);
    };
  }, [newArrivals]);

  const handleNewArrivalsScroll = (direction: 'left' | 'right') => {
    const container = newArrivalsScrollRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -(container.clientWidth / 2) : (container.clientWidth / 2);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column - Spotlight Deals */}
        <div className="w-full lg:w-1/2">
          <div className="mb-[30px] border-b border-gray-200 pb-3 flex flex-col items-start">
            <h2 className="text-xl md:text-2xl font-bold font-playfair text-black uppercase tracking-wide">
              Spotlight Deals
            </h2>
            <div className="h-[2px] bg-[#A0463E] w-24 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
            {spotlight.slice(0, 2).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Sale up to 70% banner */}
          <div className="bg-[#F2BDD4] rounded-2xl flex flex-col items-center justify-center p-6 min-h-[160px] md:min-h-[220px] shadow-sm">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-black mb-1">
              Sale Up To
            </span>
            <span className="text-5xl md:text-6xl font-black text-black leading-none tracking-tight">
              70%
            </span>
          </div>
        </div>

        {/* Right Column - New Arrivals */}
        <div className="w-full lg:w-1/2 max-lg:mt-6">
          <div className="mb-[30px] border-b border-gray-200 pb-3 flex items-center justify-between">
            <div className="flex flex-col items-start">
              <h2 className="text-xl md:text-2xl font-bold font-playfair text-black uppercase tracking-wide">
                New Arrivals
              </h2>
              <div className="h-[2px] bg-[#A0463E] w-24 mt-1" />
            </div>

            {/* Slide Arrows on mobile */}
            {newArrivals.length > 2 && (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => handleNewArrivalsScroll('left')}
                  disabled={!canScrollLeftNA}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    canScrollLeftNA
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100'
                      : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                  }`}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleNewArrivalsScroll('right')}
                  disabled={!canScrollRightNA}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    canScrollRightNA
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

          {/* Desktop View (static grid) */}
          <div className="hidden md:grid grid-cols-2 gap-4 md:gap-6">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Mobile View (Horizontal single row slider) */}
          <div
            ref={newArrivalsScrollRef}
            className="md:hidden flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {newArrivals.slice(0, 4).map((product) => (
              <div key={product.id} className="w-[calc(50%-8px)] shrink-0 snap-start">
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


