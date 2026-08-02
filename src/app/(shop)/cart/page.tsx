import React from "react";
import Link from "next/link";
import CartClient from "./CartClient";

// Ensure the page is dynamic because we load cart details from localstorage on client side
export const dynamic = "force-dynamic";

export default async function CartPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Breadcrumbs Banner */}
      <section className="bg-gray-50 py-8 border-b border-gray-150">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-medium">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800 font-bold">Shopping Cart</span>
          </div>
          <h1 className="text-3xl font-extrabold text-black uppercase tracking-wider">
            Your Cart
          </h1>
        </div>
      </section>

      {/* Main Cart Container */}
      <section className="max-w-[1440px] mx-auto px-6 py-12">
        <CartClient />
      </section>
    </main>
  );
}
