
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  { label: "HOME", href: "/", hasDropdown: false, dropdownItems: [] },
  {
    label: "SHOP",
    href: "/shop",
    hasDropdown: true,
    dropdownItems: [
      { label: "All Products", href: "/shop" },
      { label: "Saree Studio", href: "/collections/saree-studio" },
      { label: "Lehenga Choli", href: "/collections/lehenga-choli" },
      { label: "Wedding Wardrobe", href: "/collections/wedding-wardrobe" },
      { label: "Festive Fits", href: "/collections/festive-fits" },
    ],
  },
  {
    label: "COLLECTIONS",
    href: "/shop",
    hasDropdown: true,
    dropdownItems: [
      { label: "Festive Fits", href: "/collections/festive-fits" },
      { label: "Rooted Style", href: "/collections/rooted-style" },
      { label: "Urban Ethnic", href: "/collections/urban-ethnic" },
      { label: "Saree Studio", href: "/collections/saree-studio" },
      { label: "Wedding Wardrobe", href: "/collections/wedding-wardrobe" },
    ],
  },
  {
    label: "CUSTOMER CARE",
    href: "/help-center",
    hasDropdown: true,
    dropdownItems: [
      { label: "Help Center", href: "/help-center" },
      { label: "FAQs", href: "/faqs" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Refund & Exchange", href: "/refund_exchange" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-conditions" },
    ],
  },
  {
    label: "OUR HERITAGE",
    href: "/about-us",
    hasDropdown: true,
    dropdownItems: [
      { label: "About Us", href: "/about-us" },
      { label: "Our Story", href: "/our-story" },
      { label: "Our Mission", href: "/our-mission" },
    ],
  },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileOpenLink, setMobileOpenLink] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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
            Flat 20% OFF! Use:{" "}
            <span className="inline-block rounded border border-white/40 px-2 py-0.5 font-bold mx-1">
              FLAT20
            </span>{" "}
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
                <li key={link.label} className="relative flex h-12 items-center group">
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

                  {/* Desktop Hover Dropdown Menu */}
                  {link.hasDropdown && link.dropdownItems.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-52 bg-white border border-gray-100 shadow-lg rounded-b-lg py-2.5 hidden group-hover:block z-50 transition-all duration-300">
                      {link.dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-5 py-2 text-xs font-semibold uppercase text-gray-700 hover:bg-gray-50 hover:text-[#A0463E] transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}

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

          <div className="flex items-center">
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-gray-700 hover:text-[#A0463E]"
            >
              <ShoppingBag size={24} strokeWidth={1.5} />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#e21b70] text-[10px] font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Portal (renders directly in document.body to prevent parent container transform constraints) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`fixed inset-y-0 left-0 z-50 w-[300px] flex flex-col bg-[#f5f5f5] shadow-xl transition-transform duration-300 ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex h-14 border-b border-gray-100 shrink-0">
              <div className="flex-1 flex items-center justify-between bg-[#f5f5f5] px-5 py-3">
                {/* Login Link */}
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[14px] font-medium text-gray-800 hover:text-[#A0463E]"
                >
                  <User size={18} strokeWidth={1.5} className="text-gray-700" />
                  <span>Login</span>
                </Link>

                {/* Wishlist Link */}
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[14px] font-medium text-gray-800 hover:text-[#A0463E]"
                >
                  <Heart size={18} strokeWidth={1.5} className="text-black fill-black" />
                  <span>Wishlist</span>
                </Link>
              </div>

              {/* Pink Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-14 h-14 bg-[#e21b70] flex items-center justify-center text-white hover:bg-[#c81462] transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <nav className="bg-white">
                <ul className="divide-y divide-gray-100">
                  {navLinks.map((link) => {
                    const isOpen = mobileOpenLink === link.label;
                    return (
                      <li key={link.label} className="relative">
                        {link.hasDropdown ? (
                          <div>
                            {/* Parent row: Split into Text Link and Chevron Button */}
                            <div className="flex h-14 items-center">
                              {/* Main Link (left) */}
                              <Link
                                href={link.href}
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setMobileOpenLink(null);
                                }}
                                className="flex-1 flex items-center h-full px-5 text-[14px] font-bold tracking-[0.05em] text-black hover:text-[#A0463E]"
                              >
                                {link.label}
                              </Link>

                              {/* Divider Line */}
                              <div className="h-full w-[1px] bg-gray-100 shrink-0" />

                              {/* Chevron Button (right) */}
                              <button
                                onClick={() => setMobileOpenLink(isOpen ? null : link.label)}
                                className="w-14 h-full flex items-center justify-center text-gray-400 hover:text-black focus:outline-none shrink-0"
                                aria-label={`Toggle ${link.label} submenu`}
                              >
                                <ChevronDown
                                  size={16}
                                  className={`transform transition-transform duration-300 ${
                                    isOpen ? "rotate-180 text-[#A0463E]" : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Submenu Dropdown */}
                            {isOpen && (
                              <ul className="bg-[#fcfcfc] divide-y divide-gray-50 border-t border-gray-100/50">
                                {link.dropdownItems.map((item) => (
                                  <li key={item.href}>
                                    <Link
                                      href={item.href}
                                      onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setMobileOpenLink(null);
                                      }}
                                      className="block py-3.5 pl-10 pr-5 text-[12px] font-semibold tracking-wider text-gray-600 hover:bg-gray-50 hover:text-[#A0463E] transition-colors"
                                    >
                                      {item.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          /* Single Link (no dropdown, e.g., HOME) */
                          <Link
                            href={link.href}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setMobileOpenLink(null);
                            }}
                            className="flex items-center h-14 px-5 text-[14px] font-bold tracking-[0.05em] text-black hover:text-[#A0463E]"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Light Gray Area below menu items */}
              <div className="flex-1 bg-[#f5f5f5]" />
            </div>
          </div>
        </>
      , document.body)}
    </header>
  );
}

