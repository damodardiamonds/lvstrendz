'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CountdownBanner() {
  // Initialize with 15 days, 23 hours, 17 minutes, 51 seconds in seconds
  const [secondsLeft, setSecondsLeft] = useState(15 * 86400 + 23 * 3600 + 17 * 60 + 51);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <section className="w-full max-w-[1470px] mx-auto px-4 md:px-[45px] mb-[80px] max-md:mb-[50px]">
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl overflow-hidden shadow-sm bg-[#FAF0F2] border border-[#F2BDD4]/20 min-h-[400px]">
        {/* Left Column: Offer Details & Countdown */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center items-start text-left p-8 md:p-14">
          <span className="text-[#A0463E] text-base md:text-lg font-bold tracking-wider mb-2">
            Flat 20% OFF
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-8">
            Limited Time Offer! Don&apos;t Miss Out!
          </h2>

          {/* Countdown Boxes */}
          <div className="flex gap-4 md:gap-6 mb-8 select-none">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-black text-white flex items-center justify-center text-xl md:text-3xl font-black rounded-lg shadow-sm">
                {pad(days)}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 mt-2 uppercase tracking-widest">
                Days
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-black text-white flex items-center justify-center text-xl md:text-3xl font-black rounded-lg shadow-sm">
                {pad(hours)}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 mt-2 uppercase tracking-widest">
                Hours
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-black text-white flex items-center justify-center text-xl md:text-3xl font-black rounded-lg shadow-sm">
                {pad(minutes)}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 mt-2 uppercase tracking-widest">
                Mins
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-black text-white flex items-center justify-center text-xl md:text-3xl font-black rounded-lg shadow-sm">
                {pad(seconds)}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 mt-2 uppercase tracking-widest">
                Secs
              </span>
            </div>
          </div>

          <Link
            href="/shop"
            className="border-2 border-black text-black px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300 rounded"
          >
            Shop Now &rarr;
          </Link>
        </div>

        {/* Right Column: Image */}
        <div className="col-span-1 md:col-span-5 relative min-h-[300px] md:min-h-full">
          <Image
            src="https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp"
            alt="Countdown Offer"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
      </div>
    </section>
  );
}
