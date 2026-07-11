
import { prisma } from './db';

// ==================== TYPES ====================

export type ProductForHome = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string;
  discount: number;
  isOnSale: boolean;
};

// ==================== HELPER ====================
function toProductForHome(product: {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  compareAtPrice: unknown;
  images: { url: string }[];
}): ProductForHome {
  const price = Number(product.price);
  const originalPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price,
    originalPrice,
    image: product.images[0]?.url ?? '/images/placeholder.jpg',
    discount,
    isOnSale: discount > 0,
  };
}

// ==================== SPOTLIGHT DEALS ====================
export async function getSpotlightDeals(limit = 4): Promise<ProductForHome[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      compareAtPrice: { not: null },
    },
    orderBy: { price: 'asc' },
    take: limit,
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  return products.map(toProductForHome);
}

// ==================== NEW ARRIVALS ====================
export async function getNewArrivals(limit = 4): Promise<ProductForHome[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  return products.map(toProductForHome);
}

// ==================== ELITE COLLECTION ====================
export async function getEliteCollection(limit = 4): Promise<ProductForHome[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  return products.map(toProductForHome);
}

// ==================== JUST FOR YOU ====================
export async function getJustForYou(limit = 8): Promise<ProductForHome[]> {
  const count = await prisma.product.count({ where: { isActive: true } });
  const skip = Math.max(0, Math.floor(Math.random() * count) - limit);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    skip,
    take: limit,
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  return products.map(toProductForHome);
}

// ==================== HOMEPAGE AGGREGATOR ====================
export async function getHomepageProducts() {
  const [spotlight, newArrivals, elite, justForYou] = await Promise.all([
    getSpotlightDeals(),
    getNewArrivals(),
    getEliteCollection(),
    getJustForYou(),
  ]);

  return {
    spotlight,
    newArrivals,
    elite,
    justForYou,
  };
}

// ==================== GET PRODUCT BY SLUG ====================
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      videos: { orderBy: { sortOrder: 'asc' } },
      categories: { include: { category: true } },
      variants: {
        where: { isActive: true },
        include: {
          attributes: {
            include: { attributeValue: { include: { attribute: true } } },
          },
          images: true,
        },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  });

  return product;
}

// ==================== GET ALL PRODUCTS (PAGINATED) ====================
export async function getAllProducts({
  page = 1,
  limit = 12,
  categorySlug,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const where = {
    isActive: true,
    ...(categorySlug && {
      categories: {
        some: {
          category: { slug: categorySlug },
        },
      },
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        categories: { include: { category: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

