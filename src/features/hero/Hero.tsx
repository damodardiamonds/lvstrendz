
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const banners = [
  {
    title: "Wedding Collection 2026",
    subtitle: "Stunning Lehengas & Gowns for Your Special Day",
    cta: "Shop Wedding Wardrobe",
    href: "/category/wedding-wardrobe",
    bgColor: "from-[#A0463E] to-[#7a342e]",
  },
  {
    title: "Festive Season Sale",
    subtitle: "Use Code FLAT20 for 20% Off on All Orders",
    cta: "Shop Now",
    href: "/shop",
    bgColor: "from-[#6B2D5B] to-[#4a1f3f]",
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh Styles Added Every Week — Be the First to Wear Them",
    cta: "Explore New Arrivals",
    href: "/category/new-arrivals",
    bgColor: "from-[#2D5B6B] to-[#1f3f4a]",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div
        className={`bg-gradient-to-r ${banners[current].bgColor} transition-all duration-700`}
      >
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
            {banners[current].title}
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {banners[current].subtitle}
          </p>
          <Link
            href={banners[current].href}
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {banners[current].cta}
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              idx === current ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

