
// src/features/home/components/HeroSlider.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: '/images/hero/slide-1.jpg',
    title: 'Festive Mood',
    subtitle: 'New Collection 2026',
    cta: 'Shop Now',
    link: '/collections/festive',
  },
  {
    id: 2,
    image: '/images/hero/slide-2.jpg',
    title: 'Ethnic Elegance',
    subtitle: 'Premium Silk Collection',
    cta: 'Explore',
    link: '/collections/silk',
  },
  {
    id: 3,
    image: '/images/hero/slide-3.jpg',
    title: 'Wedding Season',
    subtitle: 'Bridal & Party Wear',
    cta: 'View Collection',
    link: '/collections/wedding',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    // Section 1: full width, no padding, max-width 1470px, gap 20px
    <section className="w-full max-w-[1470px] mx-auto m-0 p-0">
      <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover object-center"
              priority={index === 0}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-start px-[45px] md:px-[60px]">
              <div className="max-w-lg">
                <p className="text-white/80 text-sm uppercase tracking-[3px] mb-3 font-light">
                  {slide.subtitle}
                </p>
                <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  {slide.title}
                </h2>
                <Link
                  href={slide.link}
                  className="inline-block bg-white text-black px-8 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-[#A0463E] hover:text-white transition-all duration-300"
                >
                  {slide.cta} →
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === current ? 'bg-white scale-110' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

