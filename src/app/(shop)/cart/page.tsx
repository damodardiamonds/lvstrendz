import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import CartClient from "./CartClient";

// Ensure the page is dynamic because we load cart details from localstorage on client side
export const dynamic = "force-dynamic";

export default async function CartPage() {
  // 1. Fetch categories with product counts
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch color attributes
  const colors = await db.attributeValue.findMany({
    where: { attribute: { slug: "color" } },
    orderBy: { value: "asc" },
  });

  // 3. Fetch size attributes
  const sizes = await db.attributeValue.findMany({
    where: { attribute: { slug: "size" } },
    orderBy: { sortOrder: "asc" },
  });

  // 4. Fetch top rated products
  const rawTopRated = await db.product.findMany({
    where: { isActive: true },
    take: 8,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { where: { isApproved: true } },
    },
  });

  const topRated = rawTopRated
    .map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 5;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        originalPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        image: p.images[0]?.url || "/images/placeholder.jpg",
        avgRating,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating);

  // Hex color codes for WordPress/WooCommerce alignment
  const colorSwatches: Record<string, string> = {
    blue: "#8224e3",
    pink: "#ff5974",
    red: "#dd1313",
    beige: "#c69051",
    black: "#111111",
    chikoo: "#c4a484",
    "dark-green": "#006400",
    dustypink: "#dcaebe",
    green: "#008000",
    "light-grey": "#d3d3d3",
    liril: "#8fe413",
    maroon: "#800000",
    mauve: "#e0b0ff",
    "off-white": "#faf9f6",
    "onion-pink": "#d8699e",
    orange: "#f75e00",
    orage: "#f75e00",
    pista: "#b8e2b0",
    purple: "#800080",
    rust: "#c95422",
    seagreen: "#4e8c68",
    "sky-blue": "#87ceeb",
    teal: "#008080",
    white: "#ffffff",
  };

  return (
    <main className="bg-white min-h-screen">
      {/* Breadcrumbs Banner */}
      <section className="bg-gray-50 py-8 border-b border-gray-150">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-medium">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800 font-bold">Shopping Cart</span>
          </div>
          <h1 className="text-3xl font-extrabold text-black uppercase tracking-wider">
            Your Cart
          </h1>
        </div>
      </section>

      {/* Two-Column Grid Container */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: Sidebar Filters & Widgets (Col-span 3) */}
          <aside className="lg:col-span-3 space-y-10 order-2 lg:order-1 border-t lg:border-t-0 pt-10 lg:pt-0">
            {/* Widget 1: Categories */}
            <div className="border border-gray-100 rounded-xl p-6 shadow-xs bg-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Categories
              </h3>
              <ul className="space-y-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex justify-between items-center group">
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="hover:text-[#A0463E] transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#A0463E] transition-colors">
                      ({cat._count.products})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Widget 2: Price Filter */}
            <div className="border border-gray-100 rounded-xl p-6 shadow-xs bg-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Filter by Price
              </h3>
              <div className="space-y-4">
                {/* Visual price slider */}
                <div className="h-1 bg-gray-150 rounded-full relative my-6 mx-2">
                  <div className="absolute left-[15%] right-[10%] h-full bg-[#A0463E] rounded-full" />
                  <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#A0463E] border-2 border-white rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform" />
                  <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#A0463E] border-2 border-white rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform" />
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                  <div>
                    Range: <strong className="text-black">₹1,499 — ₹6,999</strong>
                  </div>
                  <Link
                    href="/shop?min_price=1499&max_price=6999"
                    className="bg-[#A0463E] hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-md transition-all duration-300 shadow-sm"
                  >
                    Filter
                  </Link>
                </div>
              </div>
            </div>

            {/* Widget 3: Color Attributes swatches */}
            <div className="border border-gray-100 rounded-xl p-6 shadow-xs bg-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Filter by Color
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((color) => {
                  const hex = colorSwatches[color.slug] || color.colorCode || "#CCCCCC";
                  const isWhite = color.slug === "white";
                  return (
                    <Link
                      key={color.id}
                      href={`/shop?color=${color.slug}`}
                      title={color.value}
                      className="group relative"
                    >
                      <span
                        className={`block w-7 h-7 rounded-full transition-transform group-hover:scale-110 border ${
                          isWhite ? "border-gray-300" : "border-transparent"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mb-1.5 whitespace-nowrap z-10">
                        {color.value}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Widget 4: Size Attributes */}
            <div className="border border-gray-100 rounded-xl p-6 shadow-xs bg-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Filter by Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Link
                    key={size.id}
                    href={`/shop?size=${size.slug}`}
                    className="flex items-center justify-center border border-gray-250 hover:border-black text-xs font-bold text-gray-750 hover:text-black w-10 h-10 rounded-md transition-all duration-300 uppercase"
                  >
                    {size.value}
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget 5: Top Rated Products */}
            <div className="border border-gray-100 rounded-xl p-6 shadow-xs bg-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Top Rated Products
              </h3>
              <div className="space-y-4">
                {topRated.map((prod) => (
                  <div key={prod.id} className="flex gap-3.5 items-center">
                    <Link
                      href={`/product/${prod.slug}`}
                      className="w-14 h-16 rounded-md overflow-hidden bg-gray-50 border border-gray-100 shrink-0"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${prod.slug}`}
                        className="block text-xs font-bold text-gray-900 hover:text-[#A0463E] transition-colors leading-tight line-clamp-2"
                      >
                        {prod.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        {prod.originalPrice ? (
                          <>
                            <span className="text-[#A0463E] font-extrabold">
                              ₹{prod.price.toLocaleString("en-IN")}
                            </span>
                            <span className="text-gray-400 line-through text-[10px]">
                              ₹{prod.originalPrice.toLocaleString("en-IN")}
                            </span>
                          </>
                        ) : (
                          <span className="text-black font-extrabold">
                            ₹{prod.price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Interactive Cart Area (Col-span 9) */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <CartClient />
          </div>
        </div>
      </section>
    </main>
  );
}
