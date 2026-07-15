
// src/frontend/features/home/components/EliteCollection.tsx
import type { ProductForHome } from '@/lib/products';
import ProductSlider from './ProductSlider';

interface EliteCollectionProps {
  products: ProductForHome[];
}

export function EliteCollection({ products }: EliteCollectionProps) {
  if (products.length === 0) return null;

  return <ProductSlider products={products.slice(0, 4)} title="The Elite Collection" />;
}


