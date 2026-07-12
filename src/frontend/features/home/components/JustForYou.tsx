
// src/features/home/components/JustForYou.tsx
import type { ProductForHome } from '@/lib/products';
import { ProductCarousel } from './ProductCarousel';

interface JustForYouProps {
  products: ProductForHome[];
}

export function JustForYou({ products }: JustForYouProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[80px] max-md:px-0 max-md:mb-[50px]">
      <div className="w-full px-[15px]">
        <div className="mb-[30px] border-b border-[#999999] flex items-start">
          <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide pb-3">
            Just For You
          </h2>
        </div>

        <ProductCarousel products={products} visibleCount={4} />
      </div>
    </section>
  );
}

