'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Desi Glam',
    href: '/shop',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_49-AM.webp',
  },
  {
    title: 'Queen Style',
    href: '/collections/wedding-wardrobe',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp',
  },
  {
    title: 'Patola Muse',
    href: '/collections/saree-studio',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_09_14-AM.webp',
  },
  {
    title: 'Festive Mood',
    href: '/collections/festive-fits',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_32-AM.webp',
  },
  {
    title: 'Ethnic Glow',
    href: '/collections/lehenga-choli',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_05_53-AM.webp',
  },
];

interface HeroSliderProps {
  slides?: unknown; // Keep signature compatible
}

export default function HeroSlider({}: HeroSliderProps) {
  // Desktop state: active (hovered) panel index, default to 0
  const [activePanel, setActivePanel] = useState<number>(0);

  // Mobile state: active slide index for carousel
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Mobile carousel autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] py-4">
      {/* DESKTOP VIEW: Interactive Accordion Slider */}
      <div className="hidden md:flex w-full h-[550px] gap-3 rounded-2xl overflow-hidden shadow-sm bg-gray-50">
        {slides.map((slide, index) => {
          const isActive = activePanel === index;
          return (
            <div
              key={slide.title}
              onMouseEnter={() => setActivePanel(index)}
              className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden cursor-pointer ${
                isActive ? 'flex-[4.2]' : 'flex-[1]'
              }`}
            >
              <Link href={slide.href} className="absolute inset-0 block w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center transition-transform duration-[1200ms]"
                  sizes="(max-width: 1024px) 25vw, 60vw"
                />
                {/* Dark gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-500 ${
                    isActive ? 'opacity-85' : 'opacity-60 hover:opacity-50'
                  }`}
                />

                {/* Vertical title when collapsed */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <span className="text-white text-base lg:text-lg font-bold tracking-widest uppercase rotate-90 whitespace-nowrap opacity-80 select-none">
                    {slide.title}
                  </span>
                </div>

                {/* Horizontal details when expanded */}
                <div
                  className={`absolute bottom-10 left-10 text-white transition-all duration-500 delay-150 pointer-events-none ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 block mb-2">
                    COLLECTION
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-extrabold font-playfair tracking-wide uppercase">
                    {slide.title}
                  </h3>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider border-b border-white pb-1 hover:text-white/80 transition-colors">
                    Explore Collection &rarr;
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* MOBILE VIEW: Smooth Autoplay Carousel */}
      <div className="md:hidden relative w-full h-[400px] sm:h-[450px] rounded-2xl overflow-hidden shadow-sm bg-gray-50 group">
        {slides.map((slide, index) => {
          const isCurrent = currentSlide === index;
          return (
            <div
              key={slide.title}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Link href={slide.href} className="relative block w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-10 left-6 right-6 text-white text-left">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 block mb-1">
                    COLLECTION
                  </span>
                  <h3 className="text-2xl font-bold tracking-wide uppercase mb-3">
                    {slide.title}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider border-b border-white pb-0.5">
                    Shop Now &rarr;
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Carousel Arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 active:bg-black/50 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 active:bg-black/50 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'bg-white w-4' : 'bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}



