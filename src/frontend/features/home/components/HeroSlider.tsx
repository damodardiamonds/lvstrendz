'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const accordionSlides = [
  {
    id: 1,
    title: 'Desi Glam',
    subtitle: 'Make a statement at every party',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_49-AM.webp',
    link: '/collections/party-wear',
  },
  {
    id: 2,
    title: 'Queen Style',
    subtitle: 'Royal fits for your wedding wardrobe',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp',
    link: '/collections/wedding-wardrobe',
  },
  {
    id: 3,
    title: 'Patola Muse',
    subtitle: 'Classic silk sarees with modern grace',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_09_14-AM.webp',
    link: '/collections/saree-studio',
  },
  {
    id: 4,
    title: 'Festive Mood',
    subtitle: 'Dazzling ensembles for celebrations',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_32-AM.webp',
    link: '/collections/festive-fits',
  },
  {
    id: 5,
    title: 'Ethnic Glow',
    subtitle: 'Elegant Lehenga Cholis for absolute grace',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_05_53-AM.webp',
    link: '/collections/lehenga-choli',
  },
];

interface HeroSliderProps {
  slides?: typeof accordionSlides | null;
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(2); // Default to middle panel active for balanced look
  const activeSlides = slides && slides.length > 0 ? slides : accordionSlides;

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-6">
      {/* Desktop & Tablet: Horizontal Accordion */}
      <div className="hidden md:flex w-full h-[600px] lg:h-[700px] gap-3 overflow-hidden rounded-xl bg-gray-50">
        {activeSlides.map((slide, index) => {
          const isActive = hoveredIndex === index;
          return (
            <div
              key={slide.id}
              onMouseEnter={() => setHoveredIndex(index)}
              className={`relative h-full transition-all duration-700 ease-in-out overflow-hidden cursor-pointer ${
                isActive ? 'flex-[3.5]' : 'flex-[1]'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 2 || index === 0}
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500 ${
                  isActive ? 'opacity-90' : 'opacity-60'
                }`} />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-10 text-white z-10 select-none">
                {isActive ? (
                  <div className="animate-fade-in flex flex-col items-start max-w-[85%]">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#EC9DC0] font-semibold mb-2">
                      Exclusive Collection
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-wide uppercase mb-3 text-white drop-shadow-md">
                      {slide.title}
                    </h2>
                    <p className="text-sm lg:text-base text-gray-200 mb-6 drop-shadow-sm font-medium">
                      {slide.subtitle}
                    </p>
                    <Link
                      href={slide.link}
                      className="bg-white text-black hover:bg-[#A0463E] hover:text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded shadow-md"
                    >
                      Shop Collection
                    </Link>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center h-full pb-10">
                    <h3 className="text-xl lg:text-2xl font-bold tracking-widest uppercase text-white/90 transform rotate-180 writing-mode-vertical">
                      {slide.title}
                    </h3>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical Accordion */}
      <div className="flex md:hidden flex-col w-full h-[650px] gap-2 overflow-hidden rounded-xl bg-gray-50">
        {activeSlides.map((slide, index) => {
          const isActive = hoveredIndex === index;
          return (
            <div
              key={slide.id}
              onClick={() => setHoveredIndex(isActive ? null : index)}
              className={`relative w-full transition-all duration-500 ease-in-out overflow-hidden cursor-pointer ${
                isActive ? 'h-[250px]' : 'h-[90px]'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${
                  isActive ? 'opacity-90' : 'opacity-65'
                }`} />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white z-10">
                {isActive ? (
                  <div className="animate-fade-in flex flex-col items-start">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#EC9DC0] font-semibold mb-1">
                      Exclusive Collection
                    </span>
                    <h2 className="text-xl font-bold tracking-wide uppercase mb-1">
                      {slide.title}
                    </h2>
                    <p className="text-xs text-gray-200 mb-3 font-medium">
                      {slide.subtitle}
                    </p>
                    <Link
                      href={slide.link}
                      className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded"
                    >
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full h-full pb-1">
                    <h3 className="text-lg font-bold tracking-wider uppercase text-white/95">
                      {slide.title}
                    </h3>
                    <span className="text-xs text-[#EC9DC0] uppercase tracking-wider font-semibold">
                      Explore +
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Adding custom CSS vertical text writing mode rule */}
      <style jsx global>{`
        .writing-mode-vertical {
          writing-mode: vertical-lr;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </section>
  );
}


