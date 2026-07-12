
"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Phone, Mail } from "lucide-react";
import { navLinks } from "../data/navLinks";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // Prevent body scroll when drawer is open
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
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Image
            src="/images/lvs-logo.svg"
            alt="LV's Trendz"
            width={100}
            height={34}
            style={{ width: "auto", height: "auto" }}
          />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-5 py-6">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block rounded-md px-3 py-3 text-[14px] font-medium tracking-[0.05em] text-gray-800 transition-colors hover:bg-gray-50 hover:text-[#A0463E]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100" />

        {/* Account Links */}
        <div className="px-5 py-4">
          <Link
            href="/login"
            onClick={onClose}
            className="block rounded-md px-3 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#A0463E]"
          >
            Sign In / Register
          </Link>
        </div>

        {/* Contact Info */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] text-gray-500">
            <Phone size={14} />
            <span>+91 9876543210</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] text-gray-500">
            <Mail size={14} />
            <span>hello@lvstrendz.com</span>
          </div>
        </div>
      </div>
    </>
  );
}

