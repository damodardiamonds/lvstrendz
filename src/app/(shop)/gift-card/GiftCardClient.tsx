"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";
import {
  Gift,
  User,
  Mail,
  Phone,
  Sparkles,
  CheckCircle,
  CreditCard,
  Lock,
  ShieldCheck,
  Loader2,
  Clock,
  Flame,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface GiftCardOffer {
  id: string;
  name: string;
  faceValue: number;
  sellingPrice: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxPurchases: number | null;
  totalSold: number;
  perUserLimit: number;
  description: string | null;
}

export default function GiftCardClient() {
  const router = useRouter();
  const { format } = useCurrency();

  // Offers State
  const [offers, setOffers] = useState<GiftCardOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<GiftCardOffer | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Purchase Mode: "myself" | "gift"
  const [purchaseMode, setPurchaseMode] = useState<"myself" | "gift">("myself");

  // Form Inputs
  const [buyerEmail, setBuyerEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active offers
  useEffect(() => {
    async function loadActiveOffers() {
      setLoadingOffers(true);
      try {
        const res = await fetch("/api/gift-cards/active-offers");
        const data = await res.json();
        if (data.success && data.offers && data.offers.length > 0) {
          setOffers(data.offers);
          setSelectedOffer(data.offers[0]); // Select first offer by default
        } else {
          setOffers([]);
        }
      } catch (e) {
        console.error("Error loading active gift card offers:", e);
        setOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    }
    loadActiveOffers();
  }, []);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      errs.buyerEmail = "Please enter a valid email address.";
    }

    if (purchaseMode === "gift") {
      if (!recipientName.trim()) {
        errs.recipientName = "Recipient's name is required.";
      }
      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        errs.recipientEmail = "Please enter a valid recipient email address.";
      }
      if (recipientEmail.trim().toLowerCase() === buyerEmail.trim().toLowerCase()) {
        errs.recipientEmail = "Recipient email cannot be your own. Select 'Buy for myself' instead.";
      }
      if (personalMessage.length > 200) {
        errs.personalMessage = "Message cannot exceed 200 characters.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) {
      toast.error("Please select a gift card offer.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please correct errors in the form before proceeding.", {
        style: { background: "#3D1515", color: "#fff" },
      });
      return;
    }

    setIsSubmitting(true);
    toast.loading("Processing PayGlocal payment...", { id: "gc-process" });

    try {
      const payload = {
        offerId: selectedOffer.id,
        email: buyerEmail.trim(),
        purchasedBy: buyerEmail.trim(),
        senderName: senderName.trim() || undefined,
        isGift: purchaseMode === "gift",
        recipientName: purchaseMode === "gift" ? recipientName.trim() : undefined,
        recipientEmail: purchaseMode === "gift" ? recipientEmail.trim() : undefined,
        recipientPhone: purchaseMode === "gift" && recipientPhone ? recipientPhone.trim() : undefined,
        personalMessage: purchaseMode === "gift" ? personalMessage.trim() : undefined,
        sharedVia: purchaseMode === "gift" ? "email" : "copy",
      };

      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success && data.giftCard) {
        toast.success("Gift Card generated successfully!", {
          id: "gc-process",
          duration: 3000,
          style: { background: "#1a4223", color: "#fff" },
        });

        const gc = data.giftCard;
        const query = new URLSearchParams({
          code: gc.code,
          value: String(gc.value),
          senderName: gc.senderName || senderName || "",
          recipientName: gc.recipientName || "",
          recipientEmail: gc.recipientEmail || "",
          recipientPhone: gc.recipientPhone || "",
        }).toString();

        router.push(`/gift-card/success?${query}`);
      } else {
        throw new Error(data.error || "Failed to generate gift card");
      }
    } catch (err: any) {
      console.error("Gift card purchase error:", err);
      toast.error(err.message || "Payment or gift card generation failed.", {
        id: "gc-process",
        style: { background: "#3D1515", color: "#fff" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper calculation for days remaining
  const getDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <main className="bg-white min-h-screen pb-20">
      {/* Header Banner */}
      <section className="bg-gray-50 py-10 border-b border-gray-100 mb-12">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-black">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Gift Card Offers</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-black uppercase tracking-wide flex items-center gap-3">
            LV&apos;s Trendz Digital Gift Cards
            <span className="text-xs font-bold text-[#A0463E] bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest normal-case">
              Limited Edition Offers
            </span>
          </h1>
        </div>
      </section>

      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
        {loadingOffers ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
            <Loader2 size={36} className="animate-spin text-[#A0463E]" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Checking available gift card offers...
            </p>
          </div>
        ) : offers.length === 0 ? (
          /* Empty State when no active offers */
          <div className="max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-3xl p-12 text-center space-y-6 my-10 shadow-xs">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-[#A0463E] mx-auto">
              <Gift size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-wide">
                No Gift Card Offers Available Right Now 🎁
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Our promotional gift card offers are currently sold out or ended. Please check back soon or explore our luxury fashion collection!
              </p>
            </div>
            <Link
              href="/shop"
              className="bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest py-4 px-8 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm"
            >
              Explore Shop Collection <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Active Offers Grid & Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column: Offers Showcase & Selectors (5 columns) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  1. Choose Your Gift Card Offer
                </h3>

                <div className="space-y-4">
                  {offers.map((offer) => {
                    const isSelected = selectedOffer?.id === offer.id;
                    const remainingStock = offer.maxPurchases !== null ? offer.maxPurchases - offer.totalSold : null;
                    const isLowStock = remainingStock !== null && remainingStock <= Math.max(5, Math.ceil(offer.maxPurchases! * 0.2));
                    const daysLeft = getDaysRemaining(offer.endDate);

                    return (
                      <div
                        key={offer.id}
                        onClick={() => setSelectedOffer(offer)}
                        className={`cursor-pointer rounded-2xl p-6 transition-all border-2 relative overflow-hidden ${
                          isSelected
                            ? "bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] text-white border-[#A0463E] shadow-xl"
                            : "bg-white text-gray-900 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Selected Radio Indicator */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-[#A0463E] bg-[#A0463E]" : "border-gray-400"
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <h4 className={`text-base font-extrabold tracking-wide uppercase ${isSelected ? "text-white" : "text-gray-900"}`}>
                              {offer.name}
                            </h4>
                          </div>

                          {/* Low Stock Indicator */}
                          {isLowStock && (
                            <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Flame size={10} /> Only {remainingStock} left!
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {offer.description && (
                          <p className={`text-xs mb-4 font-medium ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                            {offer.description}
                          </p>
                        )}

                        {/* Price Breakdown */}
                        <div className="flex items-baseline justify-between pt-2 border-t border-gray-200/20">
                          <div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold block ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                              YOU PAY
                            </span>
                            <span className={`text-2xl font-black ${isSelected ? "text-[#fb7185]" : "text-[#A0463E]"}`}>
                              ₹{offer.sellingPrice.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-[10px] uppercase tracking-wider font-bold block ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                              GET VALUE
                            </span>
                            <span className={`text-lg font-bold line-through ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                              ₹{offer.faceValue.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Offer Countdown & Limit Badges */}
                        <div className={`mt-3 pt-2 border-t flex flex-wrap justify-between items-center text-[10px] font-bold ${
                          isSelected ? "border-white/10 text-gray-300" : "border-gray-100 text-gray-500"
                        }`}>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Clock size={12} /> {daysLeft > 0 ? `Ends in ${daysLeft} days` : "Expires today"}
                          </span>
                          <span>Max {offer.perUserLimit} per user</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3 text-xs text-gray-600 font-medium">
                <h4 className="font-extrabold text-black uppercase tracking-wider text-[11px]">
                  Gift Card Benefits
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#A0463E]" /> Direct Email & WhatsApp delivery
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#A0463E]" /> Partial redemption supported at checkout
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#A0463E]" /> Valid on all luxury apparel & couture
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Buyer / Recipient Form (7 columns) */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="border-b border-gray-150 pb-6 space-y-2">
                <h2 className="text-xs font-extrabold text-[#A0463E] uppercase tracking-wider">
                  2. Select Delivery Mode & Complete Purchase
                </h2>
                {selectedOffer && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-black">
                      ₹{selectedOffer.sellingPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xl font-bold text-gray-400 line-through">
                      ₹{selectedOffer.faceValue.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                      Save ₹{(selectedOffer.faceValue - selectedOffer.sellingPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handlePurchase} className="space-y-6">
                
                {/* Mode Selector Toggle */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-3">
                    Who is this Gift Card for?
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseMode("myself");
                        setErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                        purchaseMode === "myself"
                          ? "bg-white text-[#A0463E] shadow-sm border border-gray-200"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      <User size={16} />
                      Buy for Myself
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseMode("gift");
                        setErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                        purchaseMode === "gift"
                          ? "bg-white text-[#A0463E] shadow-sm border border-gray-200"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      <Gift size={16} />
                      Send as a Gift
                    </button>
                  </div>
                </div>

                {/* Form Fields Container */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  
                  {/* Buyer Email */}
                  <div>
                    <label htmlFor="buyerEmail" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                      Your Email Address (Buyer) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                      <input
                        type="email"
                        id="buyerEmail"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition ${
                          errors.buyerEmail ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.buyerEmail && (
                      <p className="text-red-500 text-xs font-bold mt-1">{errors.buyerEmail}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      Order receipt and tracking confirmation will be sent here.
                    </p>
                  </div>

                  {/* Sender Name */}
                  <div>
                    <label htmlFor="senderName" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                      Your Name (Sender Name) <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition"
                    />
                  </div>

                  {/* Recipient Fields when "Send as a Gift" */}
                  {purchaseMode === "gift" && (
                    <div className="pt-4 border-t border-gray-150 space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#A0463E] uppercase tracking-wider">
                        <Gift size={16} />
                        Recipient Information
                      </div>

                      {/* Recipient Name */}
                      <div>
                        <label htmlFor="recipientName" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                          Recipient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="recipientName"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition ${
                            errors.recipientName ? "border-red-500" : "border-gray-200"
                          }`}
                        />
                        {errors.recipientName && (
                          <p className="text-red-500 text-xs font-bold mt-1">{errors.recipientName}</p>
                        )}
                      </div>

                      {/* Recipient Email */}
                      <div>
                        <label htmlFor="recipientEmail" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                          Recipient Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="email"
                            id="recipientEmail"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition ${
                              errors.recipientEmail ? "border-red-500" : "border-gray-200"
                            }`}
                          />
                        </div>
                        {errors.recipientEmail && (
                          <p className="text-red-500 text-xs font-bold mt-1">{errors.recipientEmail}</p>
                        )}
                      </div>

                      {/* Recipient Phone (Optional for WhatsApp) */}
                      <div>
                        <label htmlFor="recipientPhone" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                          Recipient Mobile / WhatsApp <span className="text-gray-400 font-normal">(Optional for WhatsApp Share)</span>
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="tel"
                            id="recipientPhone"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Personal Message */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label htmlFor="personalMessage" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                            Personal Gift Message <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <span className={`text-[10px] font-bold ${personalMessage.length > 200 ? "text-red-500" : "text-gray-400"}`}>
                            {personalMessage.length}/200
                          </span>
                        </div>
                        <textarea
                          id="personalMessage"
                          rows={3}
                          maxLength={200}
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="e.g. Happy Birthday! Enjoy shopping for your favorite couture 🎉"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Checkout Button */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedOffer}
                    className="w-full flex items-center justify-center gap-2 bg-[#A0463E] hover:bg-black disabled:bg-[#A0463E]/70 text-white text-xs font-extrabold uppercase tracking-widest py-4 px-6 rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#A0463E] focus:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing PayGlocal Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        BUY GIFT CARD — ₹{selectedOffer?.sellingPrice.toLocaleString("en-IN")}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                    <span className="flex items-center gap-1">
                      <Lock size={12} /> PayGlocal 256-Bit SSL
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" /> Instant Email & WhatsApp
                    </span>
                  </div>
                </div>

              </form>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
