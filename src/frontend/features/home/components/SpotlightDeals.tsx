
// src/frontend/features/home/components/SpotlightDeals.tsx
import type { ProductForHome } from '@/lib/products';
import ProductCard from './ProductCard';

interface SpotlightDealsProps {
  spotlight: ProductForHome[];
  newArrivals: ProductForHome[];
}

export function SpotlightDeals({ spotlight, newArrivals }: SpotlightDealsProps) {
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
          <div className="mb-[30px] border-b border-gray-200 pb-3 flex flex-col items-start">
            <h2 className="text-xl md:text-2xl font-bold font-playfair text-black uppercase tracking-wide">
              New Arrivals
            </h2>
            <div className="h-[2px] bg-[#A0463E] w-24 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

