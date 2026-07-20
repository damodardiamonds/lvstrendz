
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/features/home/components/ProductCard";

export default async function FeaturedProducts() {
  const products = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  // If no featured products, show latest products
  const displayProducts =
    products.length > 0
      ? products
      : await db.product.findMany({
          where: { isActive: true },
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        });

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {products.length > 0 ? "Featured Collection" : "Latest Arrivals"}
        </h2>
        <p className="text-gray-600 mt-2">Handpicked styles just for you</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={Number(product.price)}
            originalPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
            image={product.images[0]?.url || "/images/placeholder.jpg"}
          />
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/shop"
          className="inline-block border-2 border-[#A0463E] text-[#A0463E] px-8 py-3 rounded-lg font-semibold hover:bg-[#A0463E] hover:text-white transition-colors"
        >
          View All Products
        </Link>
      </div>
    </section>
  );
}

