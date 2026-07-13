
// src/app/(shop)/shop/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getAllProducts } from '@/lib/products';
import ProductCard from '@/features/home/components/ProductCard';

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
  }>;
}

export const revalidate = 60; // Cache page for 60 seconds (ISR)

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const activeCategory = resolvedParams.category || '';
  const activeSort = resolvedParams.sort || 'newest';

  // Map sort options to db parameters
  let sortBy = 'createdAt';
  let sortOrder: 'asc' | 'desc' = 'desc';

  if (activeSort === 'price-asc') {
    sortBy = 'price';
    sortOrder = 'asc';
  } else if (activeSort === 'price-desc') {
    sortBy = 'price';
    sortOrder = 'desc';
  }

  // Fetch products and categories in parallel
  const [categories, { products, total, pages }] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    getAllProducts({
      page: currentPage,
      limit: 12,
      categorySlug: activeCategory || undefined,
      sortBy,
      sortOrder,
    }),
  ]);

  // Helper function to build URL queries on Server Component
  const getFilterUrl = (updates: { category?: string | null; sort?: string | null; page?: number | null }) => {
    const params = new URLSearchParams();
    
    // Set initial
    if (activeCategory) params.set('category', activeCategory);
    if (activeSort && activeSort !== 'newest') params.set('sort', activeSort);
    if (currentPage > 1) params.set('page', currentPage.toString());

    // Apply updates
    if (updates.category !== undefined) {
      if (updates.category === null) params.delete('category');
      else {
        params.set('category', updates.category);
        params.delete('page'); // reset page on category change
      }
    }
    if (updates.sort !== undefined) {
      if (updates.sort === null || updates.sort === 'newest') params.delete('sort');
      else params.set('sort', updates.sort);
    }
    if (updates.page !== undefined) {
      if (updates.page === null || updates.page <= 1) params.delete('page');
      else params.set('page', updates.page.toString());
    }

    const queryStr = params.toString();
    return `/shop${queryStr ? `?${queryStr}` : ''}`;
  };

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || 'Collection'
    : 'All Products';

  return (
    <main className="bg-white min-h-screen">
      {/* Page Header */}
      <section className="bg-gray-50 py-10 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Shop</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-black uppercase tracking-wide">
            {activeCategoryName}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Showing {products.length} of {total} products
          </p>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Filters Sidebar (3 columns) */}
          <aside className="lg:col-span-3 space-y-8 max-lg:border-b max-lg:pb-8">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Categories
              </h3>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <Link
                    href={getFilterUrl({ category: null })}
                    className={`block py-1 hover:text-[#A0463E] transition-colors ${
                      !activeCategory ? 'text-[#A0463E] font-bold' : 'text-gray-600'
                    }`}
                  >
                    All Collections ({total})
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={getFilterUrl({ category: cat.slug })}
                      className={`block py-1 hover:text-[#A0463E] transition-colors ${
                        activeCategory === cat.slug ? 'text-[#A0463E] font-bold' : 'text-gray-600'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sorting Filter */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Sort By
              </h3>
              <div className="flex flex-col gap-2 text-sm font-medium">
                <Link
                  href={getFilterUrl({ sort: 'newest' })}
                  className={`py-1.5 px-3 rounded-lg border text-xs text-center transition-all ${
                    activeSort === 'newest'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  New Arrivals
                </Link>
                <Link
                  href={getFilterUrl({ sort: 'price-asc' })}
                  className={`py-1.5 px-3 rounded-lg border text-xs text-center transition-all ${
                    activeSort === 'price-asc'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={getFilterUrl({ sort: 'price-desc' })}
                  className={`py-1.5 px-3 rounded-lg border text-xs text-center transition-all ${
                    activeSort === 'price-desc'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  Price: High to Low
                </Link>
              </div>
            </div>
          </aside>

          {/* Product Grid (9 columns) */}
          <div className="lg:col-span-9 space-y-10">
            {products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <p className="text-gray-500 font-medium text-lg">No products found in this category.</p>
                <Link
                  href="/shop"
                  className="mt-4 inline-block bg-[#A0463E] text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-lg hover:bg-black transition-colors"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={Number(product.price)}
                      originalPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                      image={product.images[0]?.url || '/images/placeholder.jpg'}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-8">
                    {/* Previous Page */}
                    {currentPage > 1 && (
                      <Link
                        href={getFilterUrl({ page: currentPage - 1 })}
                        className="p-2 border border-gray-200 hover:border-black rounded-lg text-sm transition-colors text-gray-700"
                        aria-label="Previous Page"
                      >
                        ← Prev
                      </Link>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: pages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isCurrent = pageNum === currentPage;
                      return (
                        <Link
                          key={pageNum}
                          href={getFilterUrl({ page: pageNum })}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                            isCurrent
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}

                    {/* Next Page */}
                    {currentPage < pages && (
                      <Link
                        href={getFilterUrl({ page: currentPage + 1 })}
                        className="p-2 border border-gray-200 hover:border-black rounded-lg text-sm transition-colors text-gray-700"
                        aria-label="Next Page"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}
