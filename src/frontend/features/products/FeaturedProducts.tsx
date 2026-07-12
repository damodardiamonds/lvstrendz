
import Link from "next/link";
import { db } from "@/lib/db";

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
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group"
          >
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
              {product.images[0] ? (
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#A0463E] transition-colors">
              {product.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-gray-500 line-through">
                  ₹{Number(product.compareAtPrice).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </Link>
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

