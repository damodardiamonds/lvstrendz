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
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface Color {
  name: string;
  slug: string;
  colorCode: string;
}

interface Size {
  name: string;
  slug: string;
}

interface TopRatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string;
  rating: number;
  reviewsCount: number;
}

interface CheckoutClientProps {
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  topRatedProducts: TopRatedProduct[];
}

export default function CheckoutClient({
  categories,
  colors,
  sizes,
  topRatedProducts,
}: CheckoutClientProps) {
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
  const [paymentMethod] = useState<"PayGlocal">("PayGlocal");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topRatedIndex, setTopRatedIndex] = useState(0);

  // Price slider filter state (WooCommerce Widget simulation)
  const [priceRange, setPriceRange] = useState({ min: 1499, max: 6999 });

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

  // Top rated product carousel navigation
  const nextTopRated = () => {
    setTopRatedIndex((prev) => (prev + 1) % topRatedProducts.length);
  };

  const prevTopRated = () => {
    setTopRatedIndex((prev) => (prev - 1 + topRatedProducts.length) % topRatedProducts.length);
  };

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
        paymentMethod: "PayGlocal",
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
        // Initiate Secure PayGlocal Redirect
        const initRes = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: data.orderId }),
        });

        const initData = await initRes.json();

        if (initRes.ok && initData.redirectUrl) {
          // Clear local storage cart data
          localStorage.removeItem("lvstrendz_cart");
          localStorage.removeItem("lvstrendz_coupon");
          window.dispatchEvent(new Event("cartUpdated"));

          toast.success("Order registered! Redirecting to secure payment page...", {
            duration: 3000,
            style: { background: "#1a4223", color: "#fff" },
          });

          // Redirect browser to PayGlocal Payment Portal
          window.location.href = initData.redirectUrl;
        } else {
          // Fallback if PEM files are not yet uploaded (Development/Sandbox setup mode helper)
          if (initData.setupRequired) {
            toast.success("Order registered (Demo Sandbox Mode). Redirecting...", {
              duration: 3000,
              style: { background: "#5c3317", color: "#fff" },
            });

            localStorage.removeItem("lvstrendz_cart");
            localStorage.removeItem("lvstrendz_coupon");
            window.dispatchEvent(new Event("cartUpdated"));

            // Redirect user to the order-received confirmation page
            router.push(`/checkout/order-received?orderNumber=${data.orderNumber}&pending_verification=true`);
            return;
          }

          throw new Error(initData.error || "Unable to initiate payment with PayGlocal");
        }
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

      {/* Main Grid */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: WooCommerce Sidebar Widgets (3 columns) */}
          <aside className="lg:col-span-3 space-y-10 max-lg:order-2 max-lg:border-t max-lg:pt-10">
            
            {/* Widget: Categories */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-2xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Categories
              </h3>
              <ul className="space-y-3 text-sm font-medium">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex justify-between items-center group">
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="text-gray-600 group-hover:text-[#A0463E] transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md font-bold">
                      ({cat.count})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Widget: Price Filter */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-2xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Price
              </h3>
              <div className="space-y-4">
                {/* Simulated Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1499"
                    max="6999"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#A0463E]"
                  />
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>Range:</span>
                    <span>
                      {format(priceRange.min)} — {format(priceRange.max)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/shop?min_price=${priceRange.min}&max_price=${priceRange.max}`}
                  className="w-full text-center block bg-gray-900 hover:bg-[#A0463E] text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors"
                >
                  Filter
                </Link>
              </div>
            </div>

            {/* Widget: Colors Swatches */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-2xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Color
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((color) => (
                  <Link
                    key={color.slug}
                    href={`/shop?color=${color.slug}`}
                    title={color.name}
                    className="group relative flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 shadow-2xs hover:scale-110 hover:shadow-md transition-all"
                  >
                    <span
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <span className="absolute bottom-full mb-1.5 hidden group-hover:block bg-gray-950 text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-10 shadow-lg">
                      {color.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget: Sizes */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-2xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-3 mb-4">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Link
                    key={size.slug}
                    href={`/shop?size=${size.slug}`}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-lg text-gray-700 bg-white hover:border-[#A0463E] hover:text-[#A0463E] transition-all"
                  >
                    {size.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget: Top Rated Products Slider */}
            {topRatedProducts.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                    Top Rated
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={prevTopRated}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors"
                      aria-label="Previous rated product"
                    >
                      <ChevronLeft size={12} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={nextTopRated}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors"
                      aria-label="Next rated product"
                    >
                      <ChevronRight size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Slider Item */}
                <div className="relative overflow-hidden h-[240px] flex items-center justify-center">
                  {topRatedProducts.map((prod, idx) => {
                    const isActive = idx === topRatedIndex;
                    return (
                      <div
                        key={prod.id}
                        className={`absolute w-full top-0 left-0 transition-all duration-500 ease-in-out transform flex flex-col items-center text-center ${
                          isActive
                            ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
                            : "opacity-0 translate-x-12 scale-95 pointer-events-none"
                        }`}
                      >
                        <Link href={`/product/${prod.slug}`} className="group block mb-3.5">
                          <div className="w-32 h-40 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-2xs mx-auto">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1 max-w-[200px] mb-1">
                          <Link href={`/product/${prod.slug}`} className="hover:text-[#A0463E]">
                            {prod.name}
                          </Link>
                        </h4>
                        
                        {/* Rating Stars */}
                        <div className="flex justify-center items-center gap-0.5 text-xs text-amber-500 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>

                        {/* Prices */}
                        <div className="text-xs font-extrabold flex justify-center items-center gap-1.5">
                          {prod.originalPrice && (
                            <span className="text-gray-400 line-through">
                              {format(prod.originalPrice)}
                            </span>
                          )}
                          <span className="text-[#A0463E]">{format(prod.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Right Column: Checkout Form (9 columns) */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-9 space-y-10 max-lg:order-1">
            
            {/* Steps & Checkout Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
              
              {/* Form Inputs (7 columns) */}
              <div className="md:col-span-7 space-y-8">
                
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
              <div className="md:col-span-5 space-y-8">
                
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

                {/* Block 5: PayGlocal Payment Portal */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
                      <Lock size={16} />
                    </div>
                    <h2 className="text-base font-extrabold text-black uppercase tracking-wider">
                      Secure Checkout
                    </h2>
                  </div>

                  {/* Gateway details */}
                  <div className="space-y-4">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Processor</span>
                        <span className="text-xs font-black text-[#A0463E] uppercase tracking-wider">PayGlocal Gateway</span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                        Secure redirect checkout. Supports Credit/Debit Cards (Visa, MasterCard, Amex), UPI/Wallets, Netbanking, and International Payments.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 text-[11px] font-bold text-gray-500 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#A0463E]">✓</span>
                        <span>100% Secure 256-bit SSL Encrypted Portal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#A0463E]">✓</span>
                        <span>PCI-DSS Compliant Gateway Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#A0463E]">✓</span>
                        <span>Zero card/credentials saved on storefront</span>
                      </div>
                    </div>
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
                        Redirecting to secure gateway...
                      </>
                    ) : (
                      `Pay & Place Order (${format(grandTotal)})`
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Lock size={12} />
                    <span>Redirecting to payglocal.in for payment completion</span>
                  </div>
                </div>

              </div>

            </div>

          </form>

        </div>
      </section>
    </main>
  );
}
