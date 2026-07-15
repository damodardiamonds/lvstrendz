
// src/frontend/features/home/components/NowTrending.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function NowTrending() {
  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-sm bg-[#DFB5A5]">
        {/* Left Column: Video */}
        <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-full min-h-[400px] md:min-h-[550px] lg:min-h-[650px] overflow-hidden bg-black">
          <video
            src="https://res.cloudinary.com/n5umtsub/video/upload/v1783845178/now-trending-reel.mp4"
            className="absolute inset-0 w-full h-full object-cover object-center"
            autoPlay
            muted
            playsInline
            loop
            preload="metadata"
          />
        </div>

        {/* Right Column: Text Content */}
        <div
          className="relative w-full flex flex-col justify-center items-start text-left p-8 sm:p-12 md:p-14 lg:p-20 bg-cover bg-center bg-no-repeat min-h-[350px] md:min-h-[550px] lg:min-h-[650px]"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/n5umtsub/image/upload/v1783845069/now-trending-bg.webp')`,
          }}
        >
          {/* SEO Heading */}
          <h2 className="sr-only">Now Trending - Ethnic</h2>

          {/* Heading Label */}
          <span className="text-black text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 md:mb-6">
            NOW TRENDING
          </span>

          {/* Cursive Brand Image */}
          <div className="relative w-[75%] sm:w-[65%] md:w-[85%] max-w-[280px] h-[70px] sm:h-[80px] md:h-[95px] lg:h-[110px] mb-4 md:mb-6 select-none">
            <Image
              src="https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-28-2026-10_45_12-AM-1.webp"
              alt="Ethnic"
              fill
              className="object-contain object-left"
              priority
              sizes="(max-width: 768px) 75vw, 30vw"
            />
          </div>

          {/* Description */}
          <p className="text-gray-950 text-sm md:text-base lg:text-lg font-medium leading-relaxed mb-6 md:mb-8 max-w-md">
            Saddle up your festival look in our Western inspired fits
          </p>

          {/* Shop Now Button */}
          <Link
            href="/shop"
            className="border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-black hover:text-white transition-all duration-300 rounded-none"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


