
// src/features/home/components/NewsletterBanner.tsx
'use client';

import { useState } from 'react';

export default function NewsletterBanner() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <section className="w-full bg-[#3D1515] py-12 md:py-16">
      <div className="max-w-[1470px] mx-auto px-[45px] text-center max-md:px-4">
        {/* Newsletter Signup */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Get 20% Discount Shipped To Your Inbox
        </h2>
        <p className="text-white/70 text-sm md:text-base mb-6">
          Subscribe to our newsletter and get exclusive offers
        </p>

        {/* Email Input */}
        <form onSubmit={handleSubmit} className="flex justify-center max-w-md mx-auto mb-10">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 rounded-l"
            required
          />
          <button
            type="submit"
            className="bg-[#A0463E] px-6 py-3 text-sm font-semibold text-white uppercase tracking-wider hover:bg-[#8a3a34] transition-colors rounded-r"
          >
            Subscribe
          </button>
        </form>

        {/* Discount Banner */}
        <div className="border-t border-white/10 pt-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Flat 20% OFF
          </h3>
          <p className="text-white/70 text-sm md:text-base">
            Limited Time Offer! Don&apos;t Miss Out!
          </p>
        </div>
      </div>
    </section>
  );
}

