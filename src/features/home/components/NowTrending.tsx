
// src/features/home/components/NowTrending.tsx
'use client';

import Link from 'next/link';

export default function NowTrending() {
  return (
    // Section 5: bg image + #EC9DC0 overlay (opacity 1), flex-row, min-height 670px, padding 0 45px, mb 80px
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[80px] max-md:px-0 max-md:mb-[50px]">
      <div
        className="relative flex flex-col md:flex-row min-h-[670px] max-md:min-h-[500px] overflow-hidden"
        style={{
          backgroundImage: `url('/images/banners/trending-bg.png')`,
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto',
        }}
      >
        {/* Pink overlay - #EC9DC0 with opacity 1 */}
        <div className="absolute inset-0 bg-[#EC9DC0] z-0" />

        {/* Left Column - Video (35% width) */}
        <div className="relative z-10 w-full md:w-[35%] py-[70px] px-[15px] flex justify-center max-md:py-[40px]">
          <div className="w-full h-full min-h-[400px] md:min-h-full overflow-hidden rounded-lg">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover rounded-lg"
            >
              <source src="/videos/reel-1.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Right Column - Content (65% width) */}
        <div className="relative z-10 w-full md:w-[65%] px-[15px] flex justify-center items-center">
          <div className="w-full md:w-[50%] mx-[30px] flex flex-col gap-y-[20px] max-md:mx-0 max-md:gap-y-[10px] max-md:pb-10">
            <p className="text-white/80 text-sm uppercase tracking-[3px] font-light">
              Now Trending
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Sadiya&apos;s Up Your Festival Look
            </h2>
            <p className="text-white/90 text-base md:text-lg leading-relaxed">
              In our Women&apos;s Inspired Fit collection — blending tradition with modern style for the festive season.
            </p>
            <Link
              href="/collections/festival"
              className="inline-block self-start bg-white text-black px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 mt-2"
            >
              Shop Now →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

