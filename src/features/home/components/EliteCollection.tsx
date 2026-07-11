
// src/features/home/components/EliteCollection.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { ProductForHome } from '@/lib/products';

interface EliteCollectionProps {
  products: ProductForHome[];
}

export function EliteCollection({ products }: EliteCollectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[80px] max-md:px-0 max-md:mb-[50px]">
      <div className="w-full px-[15px]">
        <div className="mb-[30px] border-b border-[#999999] flex items-start">
          <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide pb-3">
            The Elite Collection
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {product.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-[#A0463E] text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wide">
                    {product.discount}% Off
                  </span>
                )}
              </div>
              <div className="mt-3">
                <h3 className="text-xs md:text-sm text-gray-800 font-medium line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-bold text-black">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && product.originalPrice > product.price && (

                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

