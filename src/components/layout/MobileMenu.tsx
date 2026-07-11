
"use client";

import Link from "next/link";
import { useEffect } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { name: string; slug: string }[];
}

export function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading text-xl text-brand font-bold">
            LV&apos;s Trendz
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-140px)]">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Shop by Category
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                onClick={onClose}
                className="block px-3 py-2.5 text-gray-700 hover:text-brand hover:bg-brand-50 rounded-md transition-colors font-medium"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              My Account
            </p>
            <Link
              href="/account"
              onClick={onClose}
              className="block px-3 py-2.5 text-gray-700 hover:text-brand hover:bg-brand-50 rounded-md transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/orders"
              onClick={onClose}
              className="block px-3 py-2.5 text-gray-700 hover:text-brand hover:bg-brand-50 rounded-md transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/wishlist"
              onClick={onClose}
              className="block px-3 py-2.5 text-gray-700 hover:text-brand hover:bg-brand-50 rounded-md transition-colors"
            >
              Wishlist
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <Link
            href="/login"
            onClick={onClose}
            className="btn-primary w-full text-center block"
          >
            Sign In / Register
          </Link>
        </div>
      </div>
    </>
  );
}

