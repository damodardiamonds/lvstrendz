"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  ImageIcon,
} from "lucide-react";

const mobileNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Chat", href: "/admin/chat", icon: MessageSquare },
  { label: "Media", href: "/admin/media-settings", icon: ImageIcon },
];

export default function MobileAdminBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-2 py-1 flex justify-around items-center h-16">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
              active
                ? "text-[#A0463E]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <div className={`p-1 rounded-full ${active ? "bg-[#A0463E]/10" : ""}`}>
              <Icon size={20} className={active ? "text-[#A0463E]" : "text-gray-500"} />
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
