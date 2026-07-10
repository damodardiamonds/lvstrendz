
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { position: "asc" },
  });
  return categories;
}

export default async function CategoryGrid() {
  const categories = await getCategories();

  // Show top 8 categories for the grid
  const displayCategories = categories.slice(0, 8);

  return (
    <section className="py-12 md:py-20">
      <div className="container-custom">
        <h2 className="section-heading">Shop by Category</h2>
        <p className="section-subheading">
          Explore our curated collections for every occasion
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden"
            >
              {/* Category Image */}
              <div className="absolute inset-0 bg-gray-200">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200" />
                )}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h3 className="text-white font-heading text-lg md:text-xl font-semibold">
                  {category.name}
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  {category._count.products} items
                </p>
                <span className="inline-block mt-2 text-xs text-white/90 font-medium border-b border-white/50 group-hover:border-white transition-colors">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

