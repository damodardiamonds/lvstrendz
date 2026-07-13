
// src/app/(shop)/our-story/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Our Story — LV\'s Trendz',
  description: 'Celebrating the modern woman through the timeless elegance of Indian heritage.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Who We Are
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Our Story
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24">
        <div className="space-y-12">
          {/* Main Title and Intro */}
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-black uppercase tracking-wider">
              The Journey Behind LV’s Trendz: Tradition Meets Tomorrow
            </h2>
            <p className="text-sm md:text-base font-semibold text-[#A0463E] uppercase tracking-widest">
              Celebrating the modern woman through the timeless elegance of Indian heritage
            </p>
          </div>

          {/* Paragraphs */}
          <div className="text-gray-600 space-y-6 leading-relaxed text-sm md:text-base font-medium">
            <p>
              At <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link>, we believe that fashion is far more than just clothing — it is a vibrant celebration of culture, a statement of confidence, and an expression of unique individuality. Born in the heart of India's textile capital, Surat, our brand was built on a profound love for traditional Indian ethnic wear and a sharp eye for contemporary global style.
            </p>
            <p>
              LV’s Trendz was envisioned to bridge the gap between timeless craftsmanship and modern design, creating a fashion haven for the modern woman who honors her roots while embracing the future.
            </p>

            <h3 className="text-xl font-bold text-black uppercase tracking-wide pt-4">
              Where Tradition Finds a Modern Silhouette
            </h3>
            <p>
              Every piece in our collection tells a story. From the intricate artistry of a heavily embroidered Lehenga Choli to the fluid grace of a contemporary Saree, we carefully curate and design ensembles that resonate with sophistication, comfort, and luxury.
            </p>
            <p>
              We understand that the modern Indian woman plays many roles. Whether she is looking for the grand elegance required for a wedding, the vibrant energy of a festive celebration, or the effortless grace needed for a close family gathering, LV’s Trendz offers outfits that make her look stunning and feel incomparably confident.
            </p>

            <h3 className="text-xl font-bold text-black uppercase tracking-wide pt-4">
              Our Roots & Heritage
            </h3>
            <p>
              With over <span className="text-black font-bold">7 years of expertise</span> in the fashion industry, our journey began with a simple but powerful vision: to make premium, high-quality ethnic wear accessible without compromising on the authentic spirit of Indian craftsmanship. Inspired by the rich tapestry of colors, textures, and artisanal heritage across India, we continuously innovate with fabrics, silhouettes, and embellishments.
            </p>
            <p>
              Today, LV’s Trendz has evolved into a trusted destination for fashion-forward ethnic wear. We are proud to be a brand that celebrates femininity, honors centuries-old textile traditions, and inspires confidence — one exquisite outfit at a time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

