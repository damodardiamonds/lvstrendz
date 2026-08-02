"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";
import {
  CreditCard,
  Lock,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronDown,
  ShoppingBag,
  Smartphone,
  Landmark,
  Globe,
  ShieldCheck,
} from "lucide-react";
import PaymentModal from "./PaymentModal";

export default function CheckoutClient() {
  const { format } = useCurrency();
  const router = useRouter();

  // Cart and Discount states
  const [items, setItems] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Billing form states
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    notes: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shipping choice
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Payment choice
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "NETBANKING" | "PAYGLOCAL">("CARD");

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    number: string;
  } | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load cart and coupon
  useEffect(() => {
    setIsMounted(true);
    try {
      const cart = JSON.parse(localStorage.getItem("lvstrendz_cart") || "[]");
      setItems(cart);

      const coupon = localStorage.getItem("lvstrendz_coupon");
      if (coupon) {
        setAppliedCoupon(JSON.parse(coupon));
      }
    } catch (e) {
      console.error("Error reading cart/coupon from localStorage:", e);
    }
  }, []);

  // Compute checkout sums
  const subtotal = items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (!appliedCoupon.minOrderValue || subtotal >= appliedCoupon.minOrderValue) {
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

  // Shipping logic
  const shippingCost =
    shippingMethod === "express"
      ? 250
      : 0;

  const grandTotal = Math.max(0, subtotal - discount + shippingCost);

  // Handlers for inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // PayGlocal integration logic



  // Field validations
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!form.phone.trim() || !/^\+?[0-9\s-]{10,14}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid phone number (10-12 digits).";
    }
    if (!form.line1.trim()) newErrors.line1 = "Street address is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.state.trim()) newErrors.state = "State is required.";
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit Pincode.";
    }

    // PayGlocal handles checkout inputs and validation on its secure portal

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form before placing order.", {
        style: { background: "#3D1515", color: "#fff" },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        ...form,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku || null,
          price: item.price,
          quantity: item.quantity,
          attributes: {
            size: item.size || null,
            color: item.color || null,
            customMeasurements: item.customMeasurements || null,
          },
        })),
        couponCode: appliedCoupon?.code || null,
        subtotal,
        discount,
        shipping: shippingCost,
        total: grandTotal,
        paymentMethod,
        paymentId: "PENDING",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Handle PayGlocal Hosted Gateway option if selected
        if (paymentMethod === "PAYGLOCAL") {
          try {
            const initRes = await fetch("/api/payment/initiate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderId: data.orderId }),
            });

            const initData = await initRes.json();

            if (initRes.ok && initData.redirectUrl) {
              toast.success("Redirecting to PayGlocal secure gateway...", {
                duration: 3000,
                style: { background: "#1a4223", color: "#fff" },
              });
              window.location.href = initData.redirectUrl;
              return;
            }
          } catch (pgErr) {
            console.warn("PayGlocal redirect unavailable, using online gateway portal modal instead.");
          }
        }

        // For CARD, UPI, NETBANKING or PayGlocal fallback: Open Payment Modal
        setCreatedOrder({
          id: data.orderId,
          number: data.orderNumber,
        });
        setIsPaymentModalOpen(true);
      } else {
        throw new Error(data.error || "Failed to submit order");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Something went wrong. Please try again.", {
        style: { background: "#3D1515", color: "#fff" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#A0463E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold text-sm">Preparing secure checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-[#A0463E] mx-auto mb-6">
          <ShoppingBag size={36} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
          Your Cart is Empty
        </h2>
        <p className="text-gray-500 max-w-md mx-auto text-sm font-semibold mb-8">
          You cannot checkout because you do not have any items in your shopping cart.
        </p>
        <Link
          href="/shop"
          className="bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-lg transition-all duration-300 shadow-sm"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      {/* Header section */}
      <section className="bg-gray-50 py-10 border-b border-gray-100 mb-10">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/cart" className="hover:text-black">Cart</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Checkout</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-black uppercase tracking-wide">
            Checkout
          </h1>
        </div>
      </section>

      {/* Main Checkout Section */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] pb-20">
        <form onSubmit={handlePlaceOrder} className="space-y-10">
          
          {/* Steps & Checkout Form Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Form Inputs (7 columns) */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* Block 1: Contact info */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
                      <Mail size={16} />
                    </div>
                    <h2 className="text-base font-extrabold text-black uppercase tracking-wider">
                      Contact Information
                    </h2>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="e.g. customer@example.com"
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                        errors.email ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      You are checking out as a guest. We'll send your receipt & tracking info here.
                    </p>
                  </div>
                </div>

                {/* Block 2: Billing details */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
                      <MapPin size={16} />
                    </div>
                    <h2 className="text-base font-extrabold text-black uppercase tracking-wider">
                      Billing & Shipping Address
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                          errors.firstName ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                          errors.lastName ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                        errors.phone ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Country/Region
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none bg-white transition"
                    >
                      <option value="India">India</option>
                      <option value="United States (US)">United States (US)</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="line1" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="line1"
                      name="line1"
                      value={form.line1}
                      onChange={handleInputChange}
                      placeholder="House number and street name"
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition mb-3.5 ${
                        errors.line1 ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {errors.line1 && (
                      <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.line1}
                      </p>
                    )}
                    <input
                      type="text"
                      id="line2"
                      name="line2"
                      value={form.line2}
                      onChange={handleInputChange}
                      placeholder="Apartment, suite, unit, etc. (optional)"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                        Town / City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                          errors.city ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                          errors.state ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      {errors.state && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Pincode / ZIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit ZIP code"
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                        errors.pincode ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Block 3: Order Notes */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div>
                    <label htmlFor="notes" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleInputChange}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary & Payments (5 columns) */}
              <div className="lg:col-span-5 space-y-8">
                
                {/* Block 4: Order totals & summary */}
                <div className="bg-[#FAF8F5] border border-[#F0EBE0] rounded-2xl p-6 shadow-2xs space-y-5">
                  <h2 className="text-sm font-extrabold text-black uppercase tracking-wider border-b border-[#F0EBE0] pb-3.5">
                    Your Order
                  </h2>

                  {/* Item List */}
                  <div className="divide-y divide-[#F0EBE0] max-h-[220px] overflow-y-auto scrollbar-hide pr-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="py-3.5 flex justify-between gap-4 text-xs">
                        <div className="font-semibold text-gray-700 max-w-[70%]">
                          <span className="text-black font-extrabold">{item.name}</span>
                          {item.size || item.color ? (
                            <span className="block text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                              {item.size ? `Size: ${item.size === 'CS' ? 'Custom Size' : item.size}` : ""}
                              {item.size && item.color ? " | " : ""}
                              {item.color ? `Color: ${item.color}` : ""}
                            </span>
                          ) : null}
                          {item.customMeasurements && (
                            <span className="block text-[9px] text-gray-500 font-semibold normal-case mt-0.5 border-l border-gray-300 pl-1.5">
                              Bust: {item.customMeasurements.bust}&quot; | Waist: {item.customMeasurements.waist}&quot; | Hip: {item.customMeasurements.hip}&quot; | Shoulder: {item.customMeasurements.shoulder}&quot;
                            </span>
                          )}
                          <span className="text-gray-400 font-bold text-[10px] block mt-0.5">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <div className="font-extrabold text-black self-center shrink-0">
                          {format(Number(item.price) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-[#F0EBE0] pt-4.5 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-gray-600 font-medium">
                      <span>Subtotal</span>
                      <span className="font-extrabold text-black">{format(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 font-semibold">
                        <span>
                          Discount {appliedCoupon?.code && `(${appliedCoupon.code})`}
                        </span>
                        <span>-{format(discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-gray-600 font-medium border-b border-dashed border-[#F0EBE0] pb-3">
                      <span>Shipping Method</span>
                      <div className="text-right">
                        <select
                          value={shippingMethod}
                          onChange={(e) => setShippingMethod(e.target.value as any)}
                          className="text-xs bg-transparent font-extrabold text-black border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-[#A0463E] outline-none"
                        >
                          <option value="standard">
                            Standard {shippingCost === 0 ? "(Free)" : `(${format(shippingCost)})`}
                          </option>
                          <option value="express">Express ({format(250)})</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black text-black pt-2">
                      <span>Total</span>
                      <span className="text-lg text-[#A0463E] font-black">{format(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Block 5: Select Payment Method & Gateway Portal */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
                        <Lock size={16} />
                      </div>
                      <h2 className="text-base font-extrabold text-black uppercase tracking-wider">
                        Select Payment Method
                      </h2>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={12} />
                      100% Secure
                    </span>
                  </div>

                  {/* Payment Method Radio Cards */}
                  <div className="space-y-3">
                    
                    {/* Option 1: Credit / Debit Card */}
                    <label
                      onClick={() => setPaymentMethod("CARD")}
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "CARD"
                          ? "border-[#A0463E] bg-[#A0463E]/5 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "CARD"}
                          onChange={() => setPaymentMethod("CARD")}
                          className="mt-1 accent-[#A0463E] w-4 h-4"
                        />
                        <div className="grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                              <CreditCard size={16} className="text-[#A0463E]" />
                              Credit / Debit Card
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Visa, MasterCard, RuPay, Amex</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                            Pay instantly using any Debit or Credit card with 3D-Secure 2FA protection.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 2: UPI / Instant QR */}
                    <label
                      onClick={() => setPaymentMethod("UPI")}
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "UPI"
                          ? "border-[#A0463E] bg-[#A0463E]/5 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "UPI"}
                          onChange={() => setPaymentMethod("UPI")}
                          className="mt-1 accent-[#A0463E] w-4 h-4"
                        />
                        <div className="grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                              <Smartphone size={16} className="text-[#A0463E]" />
                              UPI / Instant QR Code
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Google Pay, PhonePe, Paytm</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                            Instant payment via Dynamic QR Scan or UPI ID (Google Pay, PhonePe, Paytm, BHIM).
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 3: Net Banking */}
                    <label
                      onClick={() => setPaymentMethod("NETBANKING")}
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "NETBANKING"
                          ? "border-[#A0463E] bg-[#A0463E]/5 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "NETBANKING"}
                          onChange={() => setPaymentMethod("NETBANKING")}
                          className="mt-1 accent-[#A0463E] w-4 h-4"
                        />
                        <div className="grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                              <Landmark size={16} className="text-[#A0463E]" />
                              Net Banking
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">All Major Indian Banks</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                            Pay directly from HDFC, ICICI, SBI, Axis, Kotak, or any major Indian Bank account.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 4: PayGlocal Gateway */}
                    <label
                      onClick={() => setPaymentMethod("PAYGLOCAL")}
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "PAYGLOCAL"
                          ? "border-[#A0463E] bg-[#A0463E]/5 shadow-2xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "PAYGLOCAL"}
                          onChange={() => setPaymentMethod("PAYGLOCAL")}
                          className="mt-1 accent-[#A0463E] w-4 h-4"
                        />
                        <div className="grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                              <Globe size={16} className="text-[#A0463E]" />
                              PayGlocal Gateway
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">International / Hosted</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                            Redirect to PayGlocal portal for international cards and multi-currency payments.
                          </p>
                        </div>
                      </div>
                    </label>

                  </div>

                  {/* Submission triggers */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center bg-[#A0463E] hover:bg-black disabled:bg-[#A0463E]/70 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A0463E] focus:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Processing Order...
                      </>
                    ) : (
                      `Proceed to Payment (${format(grandTotal)})`
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Lock size={12} />
                    <span>256-Bit Encrypted Payment Gateway</span>
                  </div>
                </div>

              </div>
            </div>
          </form>
      </section>

      {/* Payment Gateway Modal */}
      {createdOrder && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            if (createdOrder?.number) {
              router.push(`/checkout/order-received?orderNumber=${createdOrder.number}`);
            }
          }}
          orderId={createdOrder.id}
          orderNumber={createdOrder.number}
          totalAmount={grandTotal}
          customerEmail={form.email}
          initialMethod={paymentMethod}
        />
      )}
    </main>
  );
}
