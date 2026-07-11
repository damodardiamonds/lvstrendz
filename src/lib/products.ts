
// src/lib/products.ts
import { prisma } from './db';

export interface ProductForHome {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  discount: number;
  isOnSale: boolean;
}

function mapProduct(product: any): ProductForHome {
  const price = product.salePrice || product.price;
  const originalPrice = product.price;
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price,
    originalPrice,
    image: product.images?.[0] || product.thumbnail || '',
    category: product.category?.name || '',
    discount,
    isOnSale: price < originalPrice,
  };
}

// Spotlight Deals - highest discount products
export async function getSpotlightDeals(limit = 1) {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      salePrice: { not: null },
    },
    orderBy: {
      salePrice: 'asc', // Lowest sale price = biggest deal
    },
    take: limit,
    include: { category: true },
  });

  return products.map(mapProduct);
}

// New Arrivals - most recently added
export async function getNewArrivals(limit = 4) {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { category: true },
  });

  return products.map(mapProduct);
}

// Elite Collection - premium/featured products
export async function getEliteCollection(limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { isFeatured: true },
        { price: { gte: 4000 } },
        { tags: { has: 'elite' } },
      ],
    },
    orderBy: { price: 'desc' },
    take: limit,
    include: { category: true },
  });

  return products.map(mapProduct);
}

// Just For You - random/mixed selection
export async function getJustForYou(limit = 4) {
  // Get total count for random offset
  const count = await prisma.product.count({ where: { isPublished: true } });
  const skip = Math.max(0, Math.floor(Math.random() * count) - limit);

  const products = await prisma.product.findMany({
    where: { isPublished: true },
    skip,
    take: limit,
    include: { category: true },
  });

  return products.map(mapProduct);
}

// All homepage data in one call (reduces DB round trips)
export async function getHomepageProducts() {
  const [spotlight, newArrivals, elite, justForYou] = await Promise.all([
    getSpotlightDeals(1),
    getNewArrivals(4),
    getEliteCollection(4),
    getJustForYou(4),
  ]);

  return { spotlight, newArrivals, elite, justForYou };
}

