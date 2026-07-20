
// src/app/(shop)/about-us/page.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Truck, CreditCard, Award, Heart, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';

export const metadata = {
  title: 'About Us — LV\'s Trendz',
  description: 'timeless Indian ethnic wear, culture, and craftsmanship.',
};

export default async function Page() {
  const mediaSetting = await db.siteSetting.findUnique({
    where: { key: 'about_us_media' },
  });

  let storyImage = "https://res.cloudinary.com/n5umtsub/image/upload/lvstrendz/products/fd41615365cea9a68738438feb0c1797.webp";
  let missionVideo = "https://res.cloudinary.com/n5umtsub/video/upload/v1783773052/lvstrendz/videos/78db5a9a-b0f4-42a3-bbf2-93a75e80f804.mp4";

  if (mediaSetting) {
    try {
      const parsed = JSON.parse(mediaSetting.value);
      if (parsed.storyImage) storyImage = parsed.storyImage;
      if (parsed.missionVideo) missionVideo = parsed.missionVideo;
    } catch {}
  }

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Our Heritage
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            About Us
          </h1>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative aspect-[4/5] md:aspect-[5/4] lg:aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-card group">
            <Image
              src={storyImage}
              alt="LV's Trendz Our Story"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col items-start">
            <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-3">
              Timeless Fashion
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black uppercase tracking-wide mb-6 relative pb-2">
              Our Story
              <span className="absolute bottom-0 left-0 w-16 h-1 bg-[#A0463E]" />
            </h2>
            <div className="text-gray-600 space-y-5 leading-relaxed text-sm md:text-base font-medium">
              <p>
                At <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link>, fashion is more than clothing — it’s a celebration of culture, confidence, and individuality. Born from a love for Indian ethnic wear and modern style, LV’s Trendz was created to bring timeless tradition and contemporary fashion together for today’s woman.
              </p>
              <p>
                We believe every woman deserves outfits that make her feel elegant, confident, and effortlessly beautiful — whether it’s for a festive celebration, a wedding, a family gathering, or everyday grace. From flowing sarees and stylish ethnic sets to statement festive wear, every collection is thoughtfully curated to reflect sophistication, comfort, and modern Indian fashion.
              </p>
              <p>
                Our journey began with a simple vision: to create a destination where women can discover ethnic wear that feels luxurious, trendy, and deeply rooted in Indian heritage. Every design at LV’s Trendz is inspired by the vibrant colors, craftsmanship, and beauty of Indian culture while embracing modern silhouettes and fashion-forward styling.
              </p>
              <p>
                Today, LV’s Trendz continues to grow as a brand that celebrates femininity, tradition, and confidence — one outfit at a time.
              </p>
            </div>
            <Link
              href="/our-story"
              className="mt-8 inline-block bg-[#A0463E] hover:bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded shadow-md"
            >
              Explore Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 md:py-24 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div className="flex flex-col items-start order-2 lg:order-1">
            <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-3">
              Empowering Women
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black uppercase tracking-wide mb-6 relative pb-2">
              Our Mission
              <span className="absolute bottom-0 left-0 w-16 h-1 bg-[#A0463E]" />
            </h2>
            <div className="text-gray-600 space-y-6 leading-relaxed text-sm md:text-base font-medium">
              <p>
                Our mission at <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link> is to empower women through fashion by offering elegant, high-quality Indian ethnic wear that blends tradition with modern trends.
              </p>
              <p className="font-semibold text-black mb-2">We are committed to:</p>
              <ul className="space-y-3.5 pl-2">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A0463E] mt-2.5 flex-shrink-0" />
                  <span>Curating stylish and comfortable ethnic collections for every occasion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A0463E] mt-2.5 flex-shrink-0" />
                  <span>Celebrating Indian craftsmanship and timeless fashion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A0463E] mt-2.5 flex-shrink-0" />
                  <span>Making premium ethnic wear accessible to modern women</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A0463E] mt-2.5 flex-shrink-0" />
                  <span>Inspiring confidence, grace, and individuality through every design</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A0463E] mt-2.5 flex-shrink-0" />
                  <span>Delivering a seamless and enjoyable shopping experience</span>
                </li>
              </ul>
              <p className="pt-2 text-sm italic">
                At LV’s Trendz, our goal is to help every woman express her unique style while staying connected to the beauty of Indian tradition.
              </p>
            </div>
            <Link
              href="/our-mission"
              className="mt-8 inline-block bg-black hover:bg-[#A0463E] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded shadow-md"
            >
              Learn More
            </Link>
          </div>

          {/* Video Player */}
          <div className="relative aspect-[9/16] max-w-[380px] mx-auto w-full rounded-2xl overflow-hidden shadow-hover order-1 lg:order-2">
            <video
              src={missionVideo}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            {/* Absolute badge */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 text-[10px] text-white/90 uppercase tracking-widest rounded-full font-bold">
              Watch Reel
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-[#262626] text-white py-20 px-4 md:px-[45px]">
        <div className="max-w-[1470px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide relative pb-3 inline-block">
              Our Values
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#EC9DC0]" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {/* Value 1 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <Package size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Packaging Sustainability</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We care for our forests. All packaging elements are designed with eco-friendly and reusable materials.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <Truck size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Worldwide Shipping</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Safe, fast, and reliable delivery directly to your doorstep, wherever you are in the world.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <CreditCard size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Online Paying</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Convenient and highly secure online checkout interfaces that allow you to pay anytime, anywhere.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <Heart size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Quality Craftsmanship</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Every piece is thoughtfully designed with premium fabrics, attention to details, comfort, and elegance.
              </p>
            </div>

            {/* Value 5 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <Award size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Our Brand</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Our brand carries more than 7 years of trusted heritage in delivering premium quality women's garments.
              </p>
            </div>

            {/* Value 6 */}
            <div className="bg-white/5 border border-white/10 hover:border-white/20 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 text-[#EC9DC0]">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3">Timeless Style</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Unique fashion ensembles that blend modern style trends with the unmatched beauty of Indian tradition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide relative pb-3 inline-block">
            Our Team
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#A0463E]" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Member 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden shadow-card border-4 border-white transition-all duration-500 group-hover:shadow-hover group-hover:scale-102">
              <Image
                src="https://lvstrendz.com/wp-content/uploads/2026/05/krishna.webp"
                alt="Krishna Kikani"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="280px"
              />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider mt-6 text-black">Krishna Kikani</h3>
            <span className="text-[#A0463E] text-sm font-semibold tracking-widest uppercase mt-1">Founder</span>
          </div>

          {/* Member 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden shadow-card border-4 border-white transition-all duration-500 group-hover:shadow-hover group-hover:scale-102">
              <Image
                src="https://lvstrendz.com/wp-content/uploads/2026/05/Divyesh-1-scaled-e1780150594916.webp"
                alt="Divyesh Kikani"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="280px"
              />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider mt-6 text-black">Divyesh Kikani</h3>
            <span className="text-[#A0463E] text-sm font-semibold tracking-widest uppercase mt-1">CEO</span>
          </div>

          {/* Member 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden shadow-card border-4 border-white transition-all duration-500 group-hover:shadow-hover group-hover:scale-102">
              <Image
                src="https://lvstrendz.com/wp-content/uploads/2026/05/WhatsApp-Image-2026-05-31-at-4.38.56-PM-e1780227623965.webp"
                alt="Devang Kothiya"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="280px"
              />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider mt-6 text-black">Devang Kothiya</h3>
            <span className="text-[#A0463E] text-sm font-semibold tracking-widest uppercase mt-1">Tailor</span>
          </div>
        </div>
      </section>
    </main>
  );
}

