
// src/features/home/components/SpotlightDeals.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { ProductForHome } from '@/lib/products';

interface SpotlightDealsProps {
  products: ProductForHome[];
}

export function SpotlightDeals({ products }: SpotlightDealsProps) {
  const mainDeal = products[0];

  if (!mainDeal) return null;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[80px] max-md:px-0 max-md:mb-[50px]">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Left Column - Spotlight Deal */}
        <div className="w-full md:w-1/2 px-[15px]">
          <div className="mb-[30px] border-b border-[#999999] flex items-start">
            <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide pb-3">
              Spotlight Deals
            </h2>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              <Link href={`/product/${mainDeal.slug}`} className="block">
                <div className="relative w-full aspect-[3/4] max-w-[380px]">
                  <Image
                    src={mainDeal.image}
                    alt={mainDeal.name}
                    fill
                    className="object-cover"
                    sizes="380px"
                  />
                </div>
              </Link>

              {/* Dark bg #020101 + Pink badge #F2BDD4 (320x70px, absolute, offset-y 15px) */}
              <div className="relative bg-[#020101] flex flex-col items-center mt-[35px] p-4">
                <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 w-[320px] h-[70px] bg-[#F2BDD4] flex items-center justify-center max-md:w-[280px]">
                  <span className="text-3xl md:text-4xl font-black text-black">
                    {mainDeal.discount}% OFF
                  </span>
                </div>
                <div className="mt-[60px] text-center pb-4">
                  <h3 className="text-white text-sm font-medium mb-2">{mainDeal.name}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-white text-lg font-bold">₹{mainDeal.price.toLocaleString()}</span>
                    {mainDeal.originalPrice && (
                      <span className="text-white/50 text-sm line-through">₹{mainDeal.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <Link
                    href={`/product/${mainDeal.slug}`}
                    className="inline-block mt-4 bg-[#F2BDD4] text-black px-6 py-2 text-sm font-semibold uppercase hover:bg-[#EC9DC0] transition-colors"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick preview */}
        <div className="w-full md:w-1/2 px-[15px] max-md:mt-10">
          <div className="mb-[30px] border-b border-[#999999] flex items-start">
            <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide pb-3">
              New Arrivals
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 2).map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {product.isOnSale && (
                    <span className="absolute top-2 left-2 bg-[#A0463E] text-white text-[10px] px-2 py-1 uppercase font-bold">
                      Sale
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="text-xs text-gray-800 font-medium line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
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
      </div>
    </section>
  );
}

