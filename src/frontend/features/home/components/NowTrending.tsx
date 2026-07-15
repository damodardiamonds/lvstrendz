
// src/frontend/features/home/components/NowTrending.tsx
'use client';

import Link from 'next/link';

export default function NowTrending() {
  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      <div
        className="relative flex items-center min-h-[500px] md:min-h-[550px] lg:min-h-[650px] overflow-hidden rounded-2xl shadow-sm bg-[#DFB5A5]"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/n5umtsub/image/upload/now-trending-bg.webp')`,
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 w-full min-h-full">
          {/* Spacer for left model */}
          <div className="hidden md:block md:col-span-4 lg:col-span-5" />

          {/* Content in the middle gap */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4 flex flex-col justify-center items-start text-left p-6 md:p-2 z-10 max-md:bg-[#DFB5A5]/90 max-md:rounded-2xl max-md:shadow-sm max-md:mx-4 max-md:my-10">
            <p className="text-gray-900 text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-1">
              Now Trending
            </p>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-normal text-[#E24E82] font-cursive leading-none mb-3">
              Ethnic
            </h2>
            <p className="text-gray-800 text-sm md:text-base lg:text-lg font-semibold leading-relaxed mb-6">
              Saddle up your festival look in our Western inspired fits
            </p>
            <Link
              href="/collections/festive-fits"
              className="border-2 border-black text-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 rounded"
            >
              Shop Now &rarr;
            </Link>
          </div>

          {/* Spacer for right model */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3" />
        </div>
      </div>
    </section>
  );
}

