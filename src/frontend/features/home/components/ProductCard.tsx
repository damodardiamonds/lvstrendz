
// src/frontend/features/home/components/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  slug: string;
}

export type Product = ProductCardProps;

export default function ProductCard({
  name,
  price,
  originalPrice,
  image,
  slug,
}: ProductCardProps) {
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
        <Image
          src={image || '/images/placeholder.jpg'}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#A0463E] text-white text-[10px] px-2.5 py-1.5 uppercase font-bold tracking-wider z-10 rounded-sm">
            {discount}% Off
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-xs md:text-sm text-gray-800 font-semibold line-clamp-2 leading-tight group-hover:text-[#A0463E] transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-black text-black">
            ₹{price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-gray-400 line-through font-medium">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

