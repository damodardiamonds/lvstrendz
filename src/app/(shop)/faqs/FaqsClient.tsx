
// src/app/(shop)/faqs/FaqsClient.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const generalFaqs = [
  {
    question: 'What does LV’s Trendz specialize in?',
    answer: 'LV’s Trendz specializes in modern Indian ethnic wear for women, including sarees, festive wear, bridal styles, dresses, and contemporary ethnic fashion.'
  },
  {
    question: 'Do you offer worldwide shipping?',
    answer: 'Yes, we offer free standard shipping on all orders worldwide with secure and reliable delivery services.'
  },
  {
    question: 'How long does delivery take?',
    answer: 'Delivery timelines may vary depending on your location, but most orders are delivered within 5–10 business days after dispatch.'
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order is shipped, you will receive tracking details via email or WhatsApp to monitor progress in real-time.'
  },
  {
    question: 'Do you offer Cash on Delivery (COD)?',
    answer: 'No, we currently do not offer Cash on Delivery (COD). All orders must be prepaid securely during checkout.'
  }
];

const productFaqs = [
  {
    question: 'Are your products true to size?',
    answer: 'Yes, our outfits follow standard sizing. We recommend checking the size guide on each product page before placing your order.'
  },
  {
    question: 'Do you offer returns or exchanges?',
    answer: 'We do not offer returns. Exchanges are available only in cases of size issues or if you receive a defective product.'
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach our support team through the contact form on LV’s Trendz or visit our Contact Us page directly.'
  },
  {
    question: 'Do you launch new collections regularly?',
    answer: 'Yes, we frequently update our collections with the latest ethnic and festive fashion trends throughout the year.'
  },
  {
    question: 'Are the product colors exactly the same as shown?',
    answer: 'We try our best to display accurate colors, though slight variations may occur due to screen settings and photography lighting.'
  }
];

interface FaqsClientProps {
  banner1_image: string;
  banner2_image: string;
}

export default function FaqsClient({ banner1_image, banner2_image }: FaqsClientProps) {
  const [openGeneral, setOpenGeneral] = useState<number | null>(0);
  const [openProduct, setOpenProduct] = useState<number | null>(0);

  const toggleGeneral = (idx: number) => {
    setOpenGeneral((prev) => (prev === idx ? null : idx));
  };

  const toggleProduct = (idx: number) => {
    setOpenProduct((prev) => (prev === idx ? null : idx));
  };

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Got Questions?
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Frequently Asked Questions
          </h1>
        </div>
      </section>

      {/* FAQs Section 1 */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center animate-fade-in">
          
          {/* General FAQs Accordion (6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-2 block">
                Shopping & Delivery
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-black uppercase tracking-wide">
                General Questions
              </h2>
            </div>

            <div className="space-y-4">
              {generalFaqs.map((faq, idx) => {
                const isOpen = openGeneral === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 bg-white"
                  >
                    <button
                      onClick={() => toggleGeneral(idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base text-gray-800 hover:text-[#A0463E] transition-colors focus:outline-none"
                    >
                      <span className="pr-4">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-[#A0463E]" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 border-t border-gray-100 text-sm text-gray-600 leading-relaxed animate-fade-in font-medium">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banner 1 (6 Columns) */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-card group">
              <Image
                src={banner1_image}
                alt="Created by Artisans"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#EC9DC0] font-bold mb-2">
                  Handcrafted Wear
                </span>
                <h3 className="text-2xl font-extrabold uppercase tracking-wide mb-3">
                  Created by Artisans
                </h3>
                <p className="text-xs text-gray-300 max-w-[85%] leading-relaxed mb-6 font-medium">
                  Every product is crafted by dedicated Indian designers and tailors with premium detailing, preserving centuries of heritage.
                </p>
                <Link
                  href="/about-us"
                  className="self-start bg-[#A0463E] hover:bg-white hover:text-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded shadow-md"
                >
                  Read More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section 2 */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 md:py-24 border-t border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Banner 2 (6 Columns) */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-card group">
              <Image
                src={banner2_image}
                alt="Crafted with Passion"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#EC9DC0] font-bold mb-2">
                  Design Excellence
                </span>
                <h3 className="text-2xl font-extrabold uppercase tracking-wide mb-3">
                  Crafted with Passion
                </h3>
                <p className="text-xs text-gray-300 max-w-[85%] leading-relaxed mb-6 font-medium">
                  We blend traditional silhouettes with modern aesthetics to produce pieces that feel fresh, premium, and unique for your wardrobe.
                </p>
                <Link
                  href="/our-story"
                  className="self-start bg-black hover:bg-[#A0463E] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded shadow-md"
                >
                  Our Story
                </Link>
              </div>
            </div>
          </div>

          {/* Product FAQs Accordion (6 Columns) */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-2 block">
                Products & Sizing
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-black uppercase tracking-wide">
                Product Support
              </h2>
            </div>

            <div className="space-y-4">
              {productFaqs.map((faq, idx) => {
                const isOpen = openProduct === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 bg-white"
                  >
                    <button
                      onClick={() => toggleProduct(idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base text-gray-800 hover:text-[#A0463E] transition-colors focus:outline-none"
                    >
                      <span className="pr-4">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-[#A0463E]" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 border-t border-gray-100 text-sm text-gray-600 leading-relaxed animate-fade-in font-medium">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
