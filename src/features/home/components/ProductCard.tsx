
// src/features/home/components/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug: string;
  showBadge?: boolean;
}

export default function ProductCard({
  name,
  price,
  originalPrice,
  image,
  slug,
  showBadge = true,
}: ProductCardProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${slug}`} className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {showBadge && discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#A0463E] text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wide">
            {discount}% Off
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-xs md:text-sm text-gray-800 font-medium line-clamp-2 leading-tight">
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-bold text-black">₹{price.toLocaleString()}</span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

