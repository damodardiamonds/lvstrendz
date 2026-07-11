// src/features/home/components/ProductCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface Product {
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
}: Product) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${slug}`} className="group">
      {/* ... rest of your JSX stays the same ... */}
    </Link>
  );
}
