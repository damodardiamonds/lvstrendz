"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ChevronDown, ChevronUp, ArrowRight, ShoppingCart } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

export default function CartClient() {
  const { format } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isCouponExpanded, setIsCouponExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart items and coupon on mount
  const loadCartAndCoupon = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("lvstrendz_cart") || "[]");
      setItems(cart);

      const coupon = localStorage.getItem("lvstrendz_coupon");
      if (coupon) {
        setAppliedCoupon(JSON.parse(coupon));
      } else {
        setAppliedCoupon(null);
      }
    } catch (e) {
      console.error("Error reading cart/coupon storage:", e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadCartAndCoupon();

    // Setup update listeners
    window.addEventListener("cartUpdated", loadCartAndCoupon);
    window.addEventListener("storage", loadCartAndCoupon);

    return () => {
      window.removeEventListener("cartUpdated", loadCartAndCoupon);
      window.removeEventListener("storage", loadCartAndCoupon);
    };
  }, []);

  const updateCartItems = (newCart: any[]) => {
    localStorage.setItem("lvstrendz_cart", JSON.stringify(newCart));
    setItems(newCart);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleUpdateQuantity = (key: { productId: string; variantId: string | null }, amount: number) => {
    const updated = items.map((item) => {
      if (item.productId === key.productId && item.variantId === key.variantId) {
        const newQty = item.quantity + amount;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });
    updateCartItems(updated);
  };

  const handleRemoveItem = (key: { productId: string; variantId: string | null }, name: string) => {
    const updated = items.filter(
      (item) => !(item.productId === key.productId && item.variantId === key.variantId)
    );
    updateCartItems(updated);
    toast.success(`${name} removed from cart.`, {
      style: {
        background: "#3D1515",
        color: "#fff",
      },
    });
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        localStorage.setItem("lvstrendz_coupon", JSON.stringify(data.coupon));
        setCouponError("");
        setCouponCode("");
        toast.success("Coupon applied successfully!", {
          style: { background: "#3D1515", color: "#fff" },
        });
      } else {
        setCouponError(data.error || "Invalid coupon code");
        toast.error(data.error || "Invalid coupon code", {
          style: { background: "#3D1515", color: "#fff" },
        });
      }
    } catch (err) {
      setCouponError("Failed to apply coupon");
      toast.error("Failed to apply coupon", {
        style: { background: "#3D1515", color: "#fff" },
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("lvstrendz_coupon");
    toast.success("Coupon removed", {
      style: { background: "#3D1515", color: "#fff" },
    });
  };

  // Prevent server-client mismatch by showing loading state until client mount
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#A0463E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold text-sm">Loading your cart details...</p>
      </div>
    );
  }

  const subtotal = items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  // Compute discount and criteria
  let discount = 0;
  let couponWarning = "";
  if (appliedCoupon) {
    if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      couponWarning = `Minimum purchase of ${format(appliedCoupon.minOrderValue)} required for this coupon.`;
    } else {
      if (appliedCoupon.type === "PERCENTAGE") {
        discount = (subtotal * appliedCoupon.value) / 100;
      } else {
        discount = appliedCoupon.value;
      }
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    }
  }

  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-[#A0463E] mb-4">
          <ShoppingCart size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 max-w-sm text-sm font-semibold mb-6">
          Looks like you haven't added anything to your cart yet. Let's find some gorgeous outfits for you!
        </p>
        <Link
          href="/shop"
          className="bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-lg transition-all duration-300 shadow-sm"
        >
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Desktop Cart Table */}
      <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl shadow-xs bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-extrabold uppercase tracking-widest text-gray-500 bg-gray-50/70">
              <th className="py-4.5 px-6 w-24">Product</th>
              <th className="py-4.5 px-6">Details</th>
              <th className="py-4.5 px-6 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {items.map((item, index) => {
              const itemKey = { productId: item.productId, variantId: item.variantId };
              return (
                <tr key={`${item.productId}-${item.variantId || ""}-${index}`} className="group">
                  {/* Image */}
                  <td className="py-6 px-6">
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs">
                      <Link href={`/product/${item.productId}`}>
                        <img
                          src={item.image || "/images/placeholder.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                  </td>

                  {/* Details (Name, Variant information, Price, Quantity selector) */}
                  <td className="py-6 px-6">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-4">
                        <Link
                          href={`/product/${item.productId}`}
                          className="text-sm font-bold text-gray-950 hover:text-[#A0463E] transition-colors leading-snug"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => handleRemoveItem(itemKey, item.name)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] font-semibold text-gray-500">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 uppercase font-bold tracking-wider">
                          {item.size && (
                            <span>
                              Size: <strong className="text-black">{item.size === 'CS' ? 'Custom Size' : item.size}</strong>
                            </span>
                          )}
                          {item.color && (
                            <span>
                              Color: <strong className="text-black">{item.color}</strong>
                            </span>
                          )}
                          <span>
                            Unit Price:{" "}
                            <strong className="text-black">{format(Number(item.price))}</strong>
                          </span>
                        </div>
                        {item.customMeasurements && (
                          <div className="border-l-2 border-[#A0463E]/30 pl-2 py-0.5 space-y-0.5 text-[10px] normal-case">
                            <span className="block uppercase text-[9px] tracking-wider text-gray-400 font-extrabold">Measurements (Inches):</span>
                            <div className="text-black">Bust: <span className="font-bold">{item.customMeasurements.bust}&quot;</span> | Waist: <span className="font-bold">{item.customMeasurements.waist}&quot;</span> | Hips: <span className="font-bold">{item.customMeasurements.hips}&quot;</span></div>
                            {item.customMeasurements.length && (
                              <div className="text-black">Length: <span className="font-bold">{item.customMeasurements.length}&quot;</span></div>
                            )}
                            {item.customMeasurements.notes && (
                              <div className="italic text-gray-500 line-clamp-2 max-w-[320px] mt-0.5">Note: &ldquo;{item.customMeasurements.notes}&rdquo;</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity adjusting buttons */}
                      <div className="flex items-center border border-gray-200 rounded-md h-8.5 w-fit overflow-hidden bg-white">
                        <button
                          onClick={() => handleUpdateQuantity(itemKey, -1)}
                          className="px-2.5 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-black select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(itemKey, 1)}
                          className="px-2.5 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Total price */}
                  <td className="py-6 px-6 text-right align-middle">
                    <span className="text-sm font-extrabold text-black">
                      {format(Number(item.price) * item.quantity)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cart List (Cards) */}
      <div className="md:hidden space-y-4">
        {items.map((item, index) => {
          const itemKey = { productId: item.productId, variantId: item.variantId };
          return (
            <div
              key={`${item.productId}-${item.variantId || ""}-${index}`}
              className="border border-gray-100 rounded-xl p-4.5 shadow-2xs bg-white flex gap-4"
            >
              {/* Image */}
              <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 shadow-2xs">
                <Link href={`/product/${item.productId}`}>
                  <img
                    src={item.image || "/images/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
              </div>

              {/* Details & Actions */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <Link
                      href={`/product/${item.productId}`}
                      className="text-xs font-bold text-gray-950 hover:text-[#A0463E] transition-colors leading-tight line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => handleRemoveItem(itemKey, item.name)}
                      className="text-gray-400 hover:text-red-650 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-1 text-[10px] font-semibold text-gray-500">
                    <div className="flex flex-wrap gap-x-3 uppercase font-bold tracking-wider">
                      {item.size && (
                        <span>
                          Size: <strong className="text-black">{item.size === 'CS' ? 'Custom Size' : item.size}</strong>
                        </span>
                      )}
                      {item.color && (
                        <span>
                          Color: <strong className="text-black">{item.color}</strong>
                        </span>
                      )}
                    </div>
                    {item.customMeasurements && (
                      <div className="border-l-2 border-[#A0463E]/30 pl-2 py-0.5 space-y-0.5 text-[10px] normal-case">
                        <span className="block uppercase text-[9px] tracking-wider text-gray-400 font-extrabold">Measurements (Inches):</span>
                        <div className="text-black">Bust: <span className="font-bold">{item.customMeasurements.bust}&quot;</span> | Waist: <span className="font-bold">{item.customMeasurements.waist}&quot;</span> | Hips: <span className="font-bold">{item.customMeasurements.hips}&quot;</span></div>
                        {item.customMeasurements.length && (
                          <div className="text-black">Length: <span className="font-bold">{item.customMeasurements.length}&quot;</span></div>
                        )}
                        {item.customMeasurements.notes && (
                          <div className="italic text-gray-500 line-clamp-2 max-w-[200px] mt-0.5">Note: &ldquo;{item.customMeasurements.notes}&rdquo;</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-gray-200 rounded-md h-7.5 overflow-hidden bg-white">
                    <button
                      onClick={() => handleUpdateQuantity(itemKey, -1)}
                      className="px-2 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} strokeWidth={2.5} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-black select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(itemKey, 1)}
                      className="px-2 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} strokeWidth={2.5} />
                    </button>
                  </div>

                  <span className="text-xs font-extrabold text-black">
                    {format(Number(item.price) * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Totals & Coupon block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        {/* Coupon input form (span 6) */}
        <div className="md:col-span-6 bg-white border border-gray-100 rounded-xl p-6 shadow-xs h-fit">
          <button
            onClick={() => setIsCouponExpanded(!isCouponExpanded)}
            className="flex items-center justify-between w-full text-xs font-extrabold text-gray-700 hover:text-black uppercase tracking-widest transition-colors"
          >
            <span>Got a Discount Code?</span>
            {isCouponExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isCouponExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-2.5 rounded-md font-semibold">
                  <span>
                    Applied Code: <strong>{appliedCoupon.code}</strong> (
                    {appliedCoupon.type === "PERCENTAGE" ? `${appliedCoupon.value}%` : format(appliedCoupon.value)} off)
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-red-750 font-bold underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter discount code"
                    className="flex-1 bg-white border border-gray-205 rounded-lg px-4 py-2.5 text-xs placeholder-gray-400 outline-none focus:border-[#A0463E] transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-[#A0463E] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition-all duration-300 shadow-sm"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-650 text-[11px] font-semibold mt-2.5">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Cart Totals Summary block (span 6) */}
        <div className="md:col-span-6 bg-gray-50 border border-gray-100 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-3 mb-2">
            Cart totals
          </h3>

          <div className="space-y-3.5 text-xs font-semibold text-gray-650">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-black font-bold">{format(subtotal)}</span>
            </div>

            {appliedCoupon && !couponWarning && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({appliedCoupon.code})</span>
                <span>-{format(discount)}</span>
              </div>
            )}

            {couponWarning && (
              <div className="text-amber-700 text-xs font-semibold">{couponWarning}</div>
            )}

            <div className="flex justify-between text-base font-extrabold text-black pt-3 border-t border-gray-200">
              <span>Estimated total</span>
              <span>{format(total)}</span>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest py-4.5 rounded-lg transition-all duration-300 shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
