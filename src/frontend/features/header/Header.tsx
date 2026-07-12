
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  User,
  Phone,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { label: "HOME", href: "/", hasDropdown: false },
  { label: "SHOP", href: "/shop", hasDropdown: true },
  { label: "COLLECTIONS", href: "/collections", hasDropdown: true },
  { label: "CUSTOMER CARE", href: "/customer-care", hasDropdown: true },
  { label: "OUR HERITAGE", href: "/our-heritage", hasDropdown: true },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 100) {
        // Always show header near top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down → hide
        setIsVisible(false);
      } else {
        // Scrolling up → show
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-white shadow-sm transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Row 1: Announcement Bar */}
      <div className="bg-[#A0463E] text-white">
        <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-center px-4">
          <p className="text-[12px] font-medium tracking-wide sm:text-[13px]">
            Flat 20% OFF on All Ethnic Wear! Use Code:{" "}
            <span className="inline-block rounded border border-white/40 px-2 py-0.5 font-bold">
              FLAT20
            </span>{" "}
            at Checkout{" "}
            <Link
              href="/shop"
              className="ml-2 underline underline-offset-2 hover:text-white/80"
            >
              Shop Now
            </Link>
          </p>
        </div>
      </div>

      {/* Row 2: Top Bar (Desktop) */}
      <div className="hidden border-b border-gray-200 lg:block">
        <div className="mx-auto flex h-10 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-6 text-[13px] text-gray-600">
            <div className="flex items-center gap-2">
              <Phone size={13} />
              <span>+91-8780389067</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={13} />
              <span>lvstrendz.info@gmail.com</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <Link href="/help" className="text-gray-700 hover:text-[#A0463E]">
              Need Help?
            </Link>
            <Link
              href="/login"
              className="font-medium text-gray-700 hover:text-[#A0463E]"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Main Header (Desktop) — Search | Logo | Icons */}
      <div className="hidden lg:block">
        <div className="relative mx-auto flex h-28 max-w-[1440px] items-center justify-between px-6">
          {/* Search Bar */}
          <div className="relative w-[260px]">
            <input
              type="text"
              placeholder="Enter key to search"
              className="w-full rounded-md border border-gray-300 py-2.5 pl-4 pr-10 text-[13px] text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#A0463E]"
            />
            <button
              aria-label="Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#A0463E]"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Logo (Centered & Large) */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/images/lvs-logo.svg"
              alt="LV's Trendz"
              className="h-20 w-auto"
            />
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <Link
              href="/account"
              aria-label="Account"
              className="text-gray-700 transition-colors hover:text-[#A0463E]"
            >
              <User size={22} strokeWidth={1.5} />
            </Link>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="text-gray-700 transition-colors hover:text-[#A0463E]"
            >
              <Heart size={22} strokeWidth={1.5} />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-gray-700 transition-colors hover:text-[#A0463E]"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              <span className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#A0463E] text-[10px] font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 4: Navigation Bar (Desktop) */}
      <div className="hidden border-t border-gray-100 lg:block">
        <div className="mx-auto max-w-[1440px] px-6">
          <nav className="flex h-12 items-center justify-center">
            <ul className="flex items-center gap-10">
              {navLinks.map((link, index) => (
                <li key={link.href} className="relative flex h-12 items-center">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1 text-[13px] font-medium tracking-[0.08em] transition-colors hover:text-[#A0463E] ${
                      index === 0 ? "text-[#A0463E]" : "text-gray-800"
                    }`}
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    )}
                  </Link>
                  {index === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#A0463E]" />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="relative flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            className="text-gray-700"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/images/lvs-logo.svg"
              alt="LV's Trendz"
              className="h-10 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="text-gray-700 hover:text-[#A0463E]"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-gray-700 hover:text-[#A0463E]"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#A0463E] text-[10px] font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
              <img
                src="/images/lvs-logo.svg"
                alt="LV's Trendz"
                className="h-9 w-auto"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="px-5 py-6">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-md px-3 py-3 text-[14px] font-medium tracking-[0.05em] text-gray-800 hover:bg-gray-50 hover:text-[#A0463E]"
                    >
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDown size={16} strokeWidth={1.5} />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mx-5 border-t border-gray-100" />

            <div className="px-5 py-4">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-md px-3 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#A0463E]"
              >
                Sign In / Register
              </Link>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <Phone size={14} />
                <span>+91-8780389067</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[13px] text-gray-500">
                <Mail size={14} />
                <span>lvstrendz.info@gmail.com</span>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

