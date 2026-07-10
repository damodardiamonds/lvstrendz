
"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  category: string;
}

export default function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  image,
  category,
}: ProductCardProps) {
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Sale Badge */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-brand text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              // TODO: Add to cart logic
            }}
            className="w-full bg-white/95 backdrop-blur-sm text-brand font-medium py-2.5 rounded-md hover:bg-brand hover:text-white transition-colors text-sm"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {category}
        </p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-brand transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">
            ${price.toFixed(2)}
          </span>
          {compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">
              ${compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

