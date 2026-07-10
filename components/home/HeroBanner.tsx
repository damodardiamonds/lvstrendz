
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

async function getHeroBanner() {
  const banner = await prisma.banner.findFirst({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return banner;
}

async function getFeaturedProduct() {
  const product = await prisma.product.findFirst({
    where: { isActive: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return product;
}

export default async function HeroBanner() {
  const [banner, featuredProduct] = await Promise.all([
    getHeroBanner(),
    getFeaturedProduct(),
  ]);

  const heroImage =
    banner?.image || featuredProduct?.images[0]?.url || "/placeholder-hero.jpg";
  const heroTitle = banner?.title || featuredProduct?.name || "New Collection";
  const heroSubtitle =
    banner?.subtitle || "Discover the latest in ethnic fashion";
  const heroLink = banner?.link || `/product/${featuredProduct?.slug || ""}`;

  return (
    <section className="relative h-[60vh] md:h-[80vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={heroTitle}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container-custom flex items-center">
        <div className="max-w-lg text-white animate-fade-in">
          <p className="text-sm md:text-base font-medium text-brand-200 mb-2 uppercase tracking-widest">
            Featured
          </p>
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {heroTitle}
          </h2>
          <p className="text-base md:text-lg text-gray-200 mb-8">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={heroLink} className="btn-primary">
              Shop Now
            </Link>
            <Link href="/shop" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900">
              View All
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

