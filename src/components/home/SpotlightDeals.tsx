
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { prisma } from "@/lib/db";

async function getSaleProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      compareAtPrice: { not: null },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      categories: { include: { category: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return products;
}

export default async function SpotlightDeals() {
  const products = await getSaleProducts();

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-brand-50/50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-block bg-brand text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            Limited Time
          </span>
          <h2 className="font-heading text-2xl md:text-4xl text-gray-900">
            Spotlight Deals
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Grab these before they&apos;re gone
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              image={product.images[0]?.url || "/placeholder-product.jpg"}
              category={product.categories[0]?.category?.name}
            />
          ))}
        </div>

        {/* View All */}
        <div className="mt-10 text-center">
          <Link href="/shop/sale-products" className="btn-primary">
            Shop All Deals
          </Link>
        </div>
      </div>
    </section>
  );
}

