
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "../data/navLinks";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block">
      <ul className="flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative text-[13px] font-medium tracking-[0.08em] transition-colors hover:text-[#A0463E] ${
                  isActive ? "text-[#A0463E]" : "text-gray-800"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-[#A0463E]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

