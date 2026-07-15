
// src/frontend/features/home/components/Footer.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-[#A0463E] text-white">
      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-12 text-center">
        {/* Brand Logo (Inverted White) */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/lvs-logo.svg"
            alt="LV's Trendz"
            width={140}
            height={56}
            className="h-14 w-auto brightness-0 invert"
          />
        </div>

        {/* Address and Contact Info */}
        <div className="space-y-2 text-sm text-white/90">
          <p className="max-w-[600px] mx-auto leading-relaxed">
            C-301 Bhavani Complex Nr. Gajera circle, Opp. Saibaba Petrol Pump, Katargam, Surat-395004
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mt-4">
            <span className="font-semibold">📞 +91-8780389067</span>
            <span className="font-semibold">✉️ lvstrendz.info@gmail.com</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs md:text-sm font-bold tracking-widest">
            <Link href="/help-center" className="hover:text-white/80 transition-colors uppercase">
              Help Center
            </Link>
            <Link href="/shop" className="hover:text-white/80 transition-colors uppercase">
              Shop
            </Link>
            <Link href="/blog" className="hover:text-white/80 transition-colors uppercase">
              Blog
            </Link>
            <Link href="/privacy-policy" className="hover:text-white/80 transition-colors uppercase">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-white/80 transition-colors uppercase">
              Terms & Conditions
            </Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/60 text-xs tracking-wider">
            &copy; 2024 LV&apos;s Trendz. All Rights Reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[10px] font-bold border border-white/20 px-2 py-1 rounded tracking-wide bg-white/5">PAYPAL</span>
            <span className="text-white/60 text-[10px] font-bold border border-white/20 px-2 py-1 rounded tracking-wide bg-white/5">MASTERCARD</span>
            <span className="text-white/60 text-[10px] font-bold border border-white/20 px-2 py-1 rounded tracking-wide bg-white/5">VISA</span>
            <span className="text-white/60 text-[10px] font-bold border border-white/20 px-2 py-1 rounded tracking-wide bg-white/5">UPI</span>
            <span className="text-white/60 text-[10px] font-bold border border-white/20 px-2 py-1 rounded tracking-wide bg-white/5">RUPAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

