'use client';

import Image from 'next/image';

interface HeroSliderProps {
  slides?: unknown;
}

export default function HeroSlider({}: HeroSliderProps) {
  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-4">
      <div className="relative w-full aspect-[21/9] max-md:aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
        <Image
          src="https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_32-AM.webp"
          alt="Festive Mood"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 1440px"
        />
      </div>
    </section>
  );
}


