
"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, User } from "lucide-react";

export default function HeaderIcons() {
  return (
    <div className="flex items-center gap-4">
      <button
        aria-label="Search"
        className="text-gray-700 transition-colors hover:text-[#A0463E]"
      >
        <Search size={20} strokeWidth={1.5} />
      </button>

      <Link
        href="/wishlist"
        aria-label="Wishlist"
        className="text-gray-700 transition-colors hover:text-[#A0463E]"
      >
        <Heart size={20} strokeWidth={1.5} />
      </Link>

      <Link
        href="/account"
        aria-label="Account"
        className="hidden text-gray-700 transition-colors hover:text-[#A0463E] lg:block"
      >
        <User size={20} strokeWidth={1.5} />
      </Link>

      <Link
        href="/cart"
        aria-label="Cart"
        className="relative text-gray-700 transition-colors hover:text-[#A0463E]"
      >
        <ShoppingBag size={20} strokeWidth={1.5} />
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#A0463E] text-[10px] font-bold text-white">
          0
        </span>
      </Link>
    </div>
  );
}

