"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { format } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isCouponExpanded, setIsCouponExpanded] = useState(false);

  // Load cart items and coupon from localStorage
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
      console.error("Error loading cart/coupon state:", e);
    }
  };

  useEffect(() => {
    loadCartAndCoupon();

    // Listen to custom updates
    window.addEventListener("cartUpdated", loadCartAndCoupon);
    window.addEventListener("storage", loadCartAndCoupon);

    return () => {
      window.removeEventListener("cartUpdated", loadCartAndCoupon);
      window.removeEventListener("storage", loadCartAndCoupon);
    };
  }, []);

  // Prevent background scrolling when open
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

  const updateCartItems = (newCart: any[]) => {
    localStorage.setItem("lvstrendz_cart", JSON.stringify(newCart));
    setItems(newCart);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleUpdateQuantity = (key: { productId: string; variantId: string | null }, amount: number) => {
    const updated = items
      .map((item) => {
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
      setCouponError("Failed to validate coupon");
      toast.error("Failed to validate coupon", {
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

  const subtotal = items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  // Compute discount and check criteria
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
  const totalCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* Backdrop Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Review Your Cart</h2>
            <span className="flex items-center justify-center bg-[#A0463E] text-white text-xs font-extrabold h-5 px-2 rounded-full">
              {totalCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors p-1"
            aria-label="Close cart"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
                <Trash2 size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-6">Your cart is currently empty.</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-block bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-md transition-all duration-300"
              >
                Return to Shop
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const itemKey = { productId: item.productId, variantId: item.variantId };
                return (
                  <div key={`${item.productId}-${item.variantId || ""}-${index}`} className="py-4 flex gap-4 first:pt-0">
                    {/* Image */}
                    <div className="w-20 h-24 bg-gray-50 rounded-md overflow-hidden shrink-0 border border-gray-100">
                      <Link href={`/product/${item.productId}`} onClick={onClose}>
                        <img
                          src={item.image || "/images/placeholder.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </Link>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={onClose}
                            className="text-sm font-bold text-gray-900 hover:text-[#A0463E] transition-colors leading-tight line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => handleRemoveItem(itemKey, item.name)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Metadata (Size, Color) */}
                        <div className="mt-1 space-y-1 text-[11px] font-semibold text-gray-500">
                          <div className="flex flex-wrap gap-x-3 uppercase">
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
                            <div className="border-l-2 border-[#A0463E]/30 pl-2 mt-1 py-0.5 space-y-0.5 text-[10px] normal-case">
                              <span className="block uppercase text-[9px] tracking-wider text-gray-400 font-extrabold">Measurements (Inches):</span>
                              <div className="text-black">Bust: <span className="font-bold">{item.customMeasurements.bust}&quot;</span> | Waist: <span className="font-bold">{item.customMeasurements.waist}&quot;</span> | Hip: <span className="font-bold">{item.customMeasurements.hip}&quot;</span> | Shoulder: <span className="font-bold">{item.customMeasurements.shoulder}&quot;</span></div>
                              {item.customMeasurements.notes && (
                                <div className="italic text-gray-500 line-clamp-2 max-w-[200px] mt-0.5">Note: &ldquo;{item.customMeasurements.notes}&rdquo;</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Action row */}
                      <div className="flex justify-between items-center mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-md h-8 overflow-hidden bg-white">
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

                        {/* Price */}
                        <span className="text-sm font-extrabold text-black">
                          {format(Number(item.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-6 shrink-0 space-y-4">
            {/* Coupon accordion */}
            <div className="border-b border-gray-100 pb-3">
              <button
                onClick={() => setIsCouponExpanded(!isCouponExpanded)}
                className="flex items-center justify-between w-full text-xs font-bold text-gray-700 hover:text-black uppercase tracking-wider transition-colors"
              >
                <span>Got a Discount Code?</span>
                {isCouponExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isCouponExpanded && (
                <div className="mt-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-md font-semibold">
                      <span>
                        Applied: <strong>{appliedCoupon.code}</strong> (
                        {appliedCoupon.type === "PERCENTAGE" ? `${appliedCoupon.value}%` : format(appliedCoupon.value)} off)
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-emerald-700 hover:text-red-700 font-bold underline ml-2"
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
                        className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2 text-xs placeholder-gray-400 outline-none focus:border-[#A0463E] transition-colors"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-black hover:bg-[#A0463E] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md transition-all duration-300"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-red-600 text-[11px] font-semibold mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Price lines */}
            <div className="space-y-2 text-sm font-semibold text-gray-600">
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

              <div className="flex justify-between text-base font-extrabold text-black pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full bg-black hover:bg-[#A0463E] text-white text-xs font-extrabold uppercase tracking-widest py-4 rounded-md transition-all duration-300 shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block text-center w-full bg-white border border-gray-200 hover:border-black text-gray-750 text-xs font-extrabold uppercase tracking-widest py-3.5 rounded-md transition-all duration-300"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
