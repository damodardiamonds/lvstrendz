
// src/frontend/features/home/components/JustForYou.tsx
import type { ProductForHome } from '@/lib/products';
import ProductSlider from './ProductSlider';

interface JustForYouProps {
  products: ProductForHome[];
}

export function JustForYou({ products }: JustForYouProps) {
  if (products.length === 0) return null;

  return <ProductSlider products={products} title="Just For You" />;
}


