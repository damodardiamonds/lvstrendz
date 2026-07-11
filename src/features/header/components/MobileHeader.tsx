
"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import HeaderIcons from "./HeaderIcons";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <div className="lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Hamburger */}
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="text-gray-700"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>

        {/* Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/images/lvs-logo.svg"
            alt="LV's Trendz"
            width={110}
            height={38}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </Link>

        {/* Icons */}
        <HeaderIcons />
      </div>
    </div>
  );
}

