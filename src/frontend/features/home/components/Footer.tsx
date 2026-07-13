
// src/features/home/components/Footer.tsx
'use client';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';

export default function Footer() {
  return (
    <footer className="w-full bg-[#3D1515] text-white">
      <div className="flex flex-col md:flex-row gap-0 p-0">
        <div className="w-full max-w-[1470px] mx-auto px-[45px] py-12 max-md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {/* Brand Info */}
            <div>
              <CldImage
                src="footer-logo"
                alt="LV's Trendz"
                width={150}
                height={50}
                className="mb-4"
              />
              <p className="text-white/60 text-sm leading-relaxed">
                C-303 Bhavani Complex, Katargam,<br />
                Surat, Gujarat, India
              </p>
              <div className="mt-4 space-y-1">
                <p className="text-white/60 text-sm">📧 lvstrendz.info@gmail.com</p>
                <p className="text-white/60 text-sm">📞 +91-8780389067</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link href="/shop" className="text-white/60 text-sm hover:text-white transition-colors">Shop</Link></li>
                <li><Link href="/shop?sort=newest" className="text-white/60 text-sm hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link href="/shop" className="text-white/60 text-sm hover:text-white transition-colors">Collections</Link></li>
                <li><Link href="/shop?sort=price-asc" className="text-white/60 text-sm hover:text-white transition-colors">Featured Deals</Link></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Help</h4>
              <ul className="space-y-2.5">
                <li><Link href="/help-center" className="text-white/60 text-sm hover:text-white transition-colors">Help Centre</Link></li>
                <li><Link href="/our-story" className="text-white/60 text-sm hover:text-white transition-colors">Our Story</Link></li>
                <li><Link href="/privacy-policy" className="text-white/60 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-conditions" className="text-white/60 text-sm hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Stay Connected</h4>
              <p className="text-white/60 text-sm mb-3">Subscribe for exclusive offers</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 rounded-l"
                />
                <button className="bg-[#A0463E] px-4 py-2.5 text-sm font-medium hover:bg-[#8a3a34] transition-colors rounded-r">
                  Subscribe
                </button>
              </div>
              {/* Social Icons */}
              <div className="flex gap-3 mt-5">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-xs">
              &copy; 2026 LV&apos;s Trendz. All Rights Reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs border border-white/20 px-2 py-1 rounded">VISA</span>
              <span className="text-white/40 text-xs border border-white/20 px-2 py-1 rounded">MC</span>
              <span className="text-white/40 text-xs border border-white/20 px-2 py-1 rounded">UPI</span>
              <span className="text-white/40 text-xs border border-white/20 px-2 py-1 rounded">RuPay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

