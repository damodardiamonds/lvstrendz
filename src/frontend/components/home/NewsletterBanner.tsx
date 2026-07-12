
"use client";

import { useState } from "react";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service
    setSubmitted(true);
  };

  return (
    <section className="py-16 md:py-20 bg-brand relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container-custom relative">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
            Get 20% Discount
          </h2>
          <p className="text-white/80 text-lg mb-2">
            Shipped To Your Inbox
          </p>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <span className="font-bold text-lg">FLAT 20% OFF</span>
            <span className="text-white/80 text-sm ml-2">
              — Limited Time Offer! Don&apos;t Miss Out!
            </span>
          </div>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-3 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Get Code
              </button>
            </form>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <p className="text-xl font-bold mb-1">🎉 Your code: FLAT20</p>
              <p className="text-white/80 text-sm">
                Apply at checkout for 20% off your order!
              </p>
            </div>
          )}

          <p className="text-white/60 text-xs mt-4">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

