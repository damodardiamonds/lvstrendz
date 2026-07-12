
// lib/types.ts - Shared TypeScript interfaces for the storefront

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: {
    name: string;
    value: string;
  }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: ProductImage[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: Variant[];
  inStock: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  isActive: boolean;
  position: number;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: Variant | null;
  quantity: number;
}

export interface SiteSetting {
  key: string;
  value: string;
}

