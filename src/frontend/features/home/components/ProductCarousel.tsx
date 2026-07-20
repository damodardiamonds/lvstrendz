// src/features/home/components/ProductCarousel.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductForHome } from '@/lib/products';
import { useCurrency } from '@/context/CurrencyContext';

interface ProductCarouselProps {
  products: ProductForHome[];
  visibleCount?: number;
}

export function ProductCarousel({ products, visibleCount = 4 }: ProductCarouselProps) {
  const { format } = useCurrency();
  const [startIndex, setStartIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const showArrows = products.length > visibleCount;

  const handlePrev = () => {
    setStartIndex((prev) => {
      if (prev === 0) {
        return products.length - visibleCount;
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setStartIndex((prev) => {
      if (prev >= products.length - visibleCount) {
        return 0;
      }
      return prev + 1;
    });
  };

  const visibleProducts = products.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="relative w-full">
      {showArrows && (
        <>
          <button
            onClick={handlePrev}
            className="absolute -left-5 top-1/3 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-10 h-10 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none"
            aria-label="Previous products"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute -right-5 top-1/3 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-10 h-10 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none"
            aria-label="Next products"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {visibleProducts.map((product) => {
          return (
            <Link key={product.id} href={`/product/${product.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {product.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-[#A0463E] text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wide z-10">
                    {product.discount}% Off
                  </span>
                )}
              </div>
              <div className="mt-3">
                <h3 className="text-xs md:text-sm text-gray-800 font-medium line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-bold text-black">
                    {format(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {format(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
