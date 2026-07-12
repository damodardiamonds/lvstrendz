
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { prisma } from "@/lib/db";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  categorySlug?: string;
  limit?: number;
  showSaleOnly?: boolean;
  sortBy?: "newest" | "price-asc" | "price-desc";
  viewAllLink?: string;
}

export default async function ProductSection({
  title,
  subtitle,
  categorySlug,
  limit = 4,
  showSaleOnly = false,
  sortBy = "newest",
  viewAllLink,
}: ProductSectionProps) {
  const where: any = { isActive: true };

  if (categorySlug) {
    where.categories = { some: { category: { slug: categorySlug } } };
  }

  if (showSaleOnly) {
    where.compareAtPrice = { not: null };
  }

  const orderBy: any =
    sortBy === "newest"
      ? { createdAt: "desc" }
      : sortBy === "price-asc"
      ? { price: "asc" }
      : { price: "desc" };

  const products = await prisma.product.findMany({
    where,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      categories: { include: { category: true }, take: 1 },
    },
    orderBy,
    take: limit,
  });

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-sm font-medium text-brand hover:text-brand-600 transition-colors hidden md:block"
            >
              View All →
            </Link>
          )}
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

        {/* Mobile View All */}
        {viewAllLink && (
          <div className="mt-8 text-center md:hidden">
            <Link href={viewAllLink} className="btn-outline text-sm">
              View All {title}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

