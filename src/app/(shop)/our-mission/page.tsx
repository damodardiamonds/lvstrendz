
// src/app/(shop)/our-mission/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Our Mission — LV\'s Trendz',
  description: 'Empowering women to express their unique identity with grace, luxury, and cultural pride.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            What Drives Us
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Our Mission
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24">
        <div className="space-y-12">
          {/* Main Title and Intro */}
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-black uppercase tracking-wider">
              Guided by Purpose, Driven by Passion
            </h2>
            <p className="text-sm md:text-base font-semibold text-[#A0463E] uppercase tracking-widest">
              Empowering women to express their unique identity with grace, luxury, and cultural pride
            </p>
          </div>

          {/* Paragraphs */}
          <div className="text-gray-600 space-y-6 leading-relaxed text-sm md:text-base font-medium">
            <p>
              Our mission at <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link> is to empower women worldwide through fashion. We aim to redefine the premium ethnic wear experience by delivering impeccably crafted, high-quality garments that seamlessly blend traditional artistry with modern trends. We don't just dress women for occasions; we elevate their personal style and connect them to the timeless beauty of Indian heritage.
            </p>

            <h3 className="text-xl font-bold text-black uppercase tracking-wide pt-4">
              The Pillars of Our Promise
            </h3>

            <div className="space-y-6 pt-2">
              {/* Pillar 1 */}
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-2">
                  Curating Elegance & Comfort
                </h4>
                <p className="text-sm">
                  We are dedicated to designing and selecting premium collections that prioritize both breathtaking aesthetics and day-long comfort, ensuring you never have to sacrifice one for the other.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-2">
                  Honoring True Craftsmanship
                </h4>
                <p className="text-sm">
                  We actively celebrate the vibrant colors, intricate embroideries, and diverse textile arts of India, keeping traditional craftsmanship alive through modern styling.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-2">
                  Accessible Luxury
                </h4>
                <p className="text-sm">
                  We believe luxury should be an experience, not an exception. We strive to make premium-grade, fashion-forward ethnic wear accessible to modern women across the globe.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-2">
                  Inspiring Individuality
                </h4>
                <p className="text-sm">
                  Every design we offer is created to spark confidence, inspire grace, and allow your personal individuality to shine through effortlessly.
                </p>
              </div>

              {/* Pillar 5 */}
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl">
                <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-2">
                  A Seamless Experience
                </h4>
                <p className="text-sm">
                  From our design studio in Surat to your doorstep, we are committed to providing a secure, reliable, and delightful shopping journey — backed by safe worldwide shipping and dedicated care.
                </p>
              </div>
            </div>

            <p className="pt-6 text-center italic text-gray-500">
              At LV’s Trendz, our ultimate goal is to accompany you through life's most beautiful celebrations, helping you express your unique style while staying beautifully connected to your roots.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

