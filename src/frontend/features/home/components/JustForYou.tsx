
// src/frontend/features/home/components/JustForYou.tsx
import type { ProductForHome } from '@/lib/products';
import ProductCard from './ProductCard';

interface JustForYouProps {
  products: ProductForHome[];
}

export function JustForYou({ products }: JustForYouProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      <div className="mb-[30px] border-b border-gray-200 pb-3 flex flex-col items-start">
        <h2 className="text-xl md:text-2xl font-bold font-playfair text-black uppercase tracking-wide">
          Just For You
        </h2>
        <div className="h-[2px] bg-[#A0463E] w-24 mt-1" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}

