
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Palette,
  BarChart3,
  Settings,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Variants", href: "/admin/variants", icon: Palette },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-wide">
          LV&apos;s Trendz
        </h1>
        <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/50">© 2026 LV&apos;s Trendz</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#A0463E] text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#A0463E] flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-[#A0463E] flex-col shadow-xl z-30">
        <SidebarContent />
      </aside>
    </>
  );
}

