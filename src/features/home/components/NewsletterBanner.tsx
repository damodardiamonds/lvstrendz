
// src/features/home/components/NewsletterBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewsletterBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 20);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full bg-[#3D1515] py-12 md:py-16">
      <div className="max-w-[1470px] mx-auto px-[45px] text-center max-md:px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Flat 30% OFF
        </h2>
        <p className="text-white/70 text-sm md:text-base mb-8">
          Limited Time Offer! Don&apos;t Miss Out!
        </p>

        {/* Countdown Timer */}
        <div className="flex justify-center gap-4 md:gap-8 mb-10">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Mins' },
            { value: timeLeft.seconds, label: 'Secs' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white/60 text-[10px] md:text-xs mt-2 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/sale"
          className="inline-block bg-white text-[#3D1515] px-10 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#F2BDD4] transition-colors"
        >
          Shop Now →
        </Link>
      </div>
    </section>
  );
}

