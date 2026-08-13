"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";
import {
  Gift,
  User,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Copy,
  CreditCard,
  Lock,
  ShieldCheck,
  Loader2,
  ArrowRight,
  RefreshCw,
  Heart,
} from "lucide-react";

export default function GiftCardClient() {
  const { format } = useCurrency();

  // Mode: "myself" | "gift"
  const [purchaseMode, setPurchaseMode] = useState<"myself" | "gift">("myself");

  // Form inputs
  const [buyerEmail, setBuyerEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCard, setCreatedCard] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

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
      if (personalMessage.length > 200) {
        errs.personalMessage = "Message cannot exceed 200 characters.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.", {
        style: { background: "#3D1515", color: "#fff" },
      });
      return;
    }

    setIsSubmitting(true);
    toast.loading("Processing payment & generating gift card...", { id: "gc-process" });

    try {
      // 1. In production, this can initiate PayGlocal payment gateway for ₹500
      // For immediate purchase API integration:
      const payload = {
        purchasedBy: buyerEmail.trim(),
        senderName: senderName.trim() || undefined,
        isGift: purchaseMode === "gift",
        recipientName: purchaseMode === "gift" ? recipientName.trim() : undefined,
        recipientEmail: purchaseMode === "gift" ? recipientEmail.trim() : undefined,
        personalMessage: purchaseMode === "gift" ? personalMessage.trim() : undefined,
      };

      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Gift Card generated and emailed successfully!", {
          id: "gc-process",
          duration: 4000,
          style: { background: "#1a4223", color: "#fff" },
        });
        setCreatedCard(data.giftCard);
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

  const handleCopyCode = () => {
    if (createdCard?.code) {
      navigator.clipboard.writeText(createdCard.code);
      setCopied(true);
      toast.success("Gift card code copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const resetForm = () => {
    setCreatedCard(null);
    setBuyerEmail("");
    setSenderName("");
    setRecipientName("");
    setRecipientEmail("");
    setPersonalMessage("");
    setErrors({});
  };

  return (
    <main className="bg-white min-h-screen pb-20">
      {/* Header section */}
      <section className="bg-gray-50 py-10 border-b border-gray-100 mb-12">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            <Link href="/" className="hover:text-black">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-black">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Gift Card</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-black uppercase tracking-wide flex items-center gap-3">
            LV&apos;s Trendz Digital Gift Card
            <span className="text-xs font-bold text-[#A0463E] bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest normal-case">
              50% OFF Limited Offer
            </span>
          </h1>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px]">
        {createdCard ? (
          /* ================= SUCCESS STATE ================= */
          <div className="max-w-2xl mx-auto bg-white border border-gray-150 rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-8 animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-100">
              <CheckCircle size={44} />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#A0463E] bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Payment Successful
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-3 mb-2 uppercase tracking-wide">
                {createdCard.isGift ? "Gift Card Sent!" : "Your Gift Card is Ready!"}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {createdCard.isGift
                  ? `We've emailed the ₹1,000 gift card directly to ${createdCard.recipientEmail} with your personal message!`
                  : `We've emailed your ₹1,000 gift card code to ${createdCard.purchasedBy}.`}
              </p>
            </div>

            {/* Render Card Visual */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#3f3f46] p-8 text-white shadow-2xl border border-gray-700 text-left space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black tracking-widest uppercase text-white">LVS TRENDZ</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Digital Luxury Gift Card</p>
                </div>
                <span className="bg-[#A0463E] text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  ₹1,000 VALUE
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center space-y-1">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  Gift Card Code
                </p>
                <div className="text-2xl md:text-3xl font-black font-mono text-[#fb7185] tracking-widest">
                  {createdCard.code}
                </div>
              </div>

              <div className="flex justify-between items-end text-xs text-gray-300 pt-2 border-t border-white/10">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Balance</span>
                  <span className="font-bold text-emerald-400">₹1,000</span>
                </div>
                {createdCard.recipientName && (
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block">For</span>
                    <span className="font-bold text-white">{createdCard.recipientName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button
                onClick={handleCopyCode}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-md"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? "Code Copied!" : "Copy Code"}
              </button>

              <Link
                href="/shop"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-sm"
              >
                Start Shopping <ArrowRight size={16} />
              </Link>
            </div>

            <button
              onClick={resetForm}
              className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider underline block mx-auto pt-2"
            >
              Buy Another Gift Card
            </button>
          </div>
        ) : (
          /* ================= PRODUCT DISPLAY & FORM ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column: Visual Card Showcase (5 columns) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] p-8 md:p-10 text-white shadow-2xl border border-gray-800 space-y-10 group">
                
                {/* Background decorative glowing orb */}
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#A0463E]/20 blur-3xl pointer-events-none group-hover:bg-[#A0463E]/30 transition-all duration-700" />

                {/* Top header */}
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-2xl font-black tracking-widest uppercase text-white">LVS TRENDZ</h2>
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest">COUTURE GIFT CARD</p>
                  </div>
                  <span className="bg-gradient-to-r from-[#A0463E] to-[#7A312B] text-white font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg border border-red-400/30">
                    ₹1,000 VALUE
                  </span>
                </div>

                {/* Center graphic chip */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-200 via-amber-400 to-yellow-600 opacity-90 border border-amber-300 shadow-inner flex items-center justify-center">
                    <div className="w-8 h-5 border border-amber-800/40 rounded-xs" />
                  </div>
                  <Sparkles size={28} className="text-[#A0463E] animate-pulse" />
                </div>

                {/* Bottom detail */}
                <div className="relative z-10 space-y-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">BUY PRICE</p>
                      <p className="text-3xl font-black text-white">₹500</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">MRP VALUE</p>
                      <p className="text-lg font-bold text-gray-400 line-through">₹1,000</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold pt-1 flex items-center gap-1">
                    <CheckCircle size={14} /> Never Expires • Usable on any order
                  </p>
                </div>
              </div>

              {/* Benefits feature list */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">
                  Why Choose LV&apos;s Trendz Gift Card?
                </h3>
                <ul className="space-y-3 text-xs text-gray-600 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A0463E]/10 text-[#A0463E] flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                    <span><strong>50% Instant Discount:</strong> Pay ₹500 today and get ₹1,000 worth of shopping credits.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A0463E]/10 text-[#A0463E] flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                    <span><strong>Instant Digital Email Delivery:</strong> Directly emailed to you or your gift recipient.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#A0463E]/10 text-[#A0463E] flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                    <span><strong>Partial Redemption Supported:</strong> Use ₹600 today and keep ₹400 for your next purchase!</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Form & Purchase Controls (7 columns) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Offer Badge & Pricing */}
              <div className="border-b border-gray-150 pb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#A0463E] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                    EXCLUSIVE DEAL
                  </span>
                  <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                    Instant 50% Savings
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-wide">
                  ₹1,000 Gift Card
                </h2>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-black text-[#A0463E]">
                    ₹500
                  </span>
                  <span className="text-xl font-bold text-gray-400 line-through">
                    ₹1,000
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    (You Save ₹500)
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Treat yourself or send a thoughtful fashion gift to family and friends. Redeemable at checkout on all apparel and accessories across LV&apos;s Trendz.
                </p>
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

                {/* Purchase Fields */}
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                          errors.buyerEmail ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.buyerEmail && (
                      <p className="text-red-500 text-xs font-bold mt-1">{errors.buyerEmail}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      Payment receipt & transaction details will be sent here.
                    </p>
                  </div>

                  {/* Sender Name (Optional) */}
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Additional Recipient Fields when "Send as a Gift" is active */}
                  {purchaseMode === "gift" && (
                    <div className="pt-4 border-t border-gray-150 space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#A0463E] uppercase tracking-wider">
                        <Gift size={16} />
                        Recipient Details
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
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
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
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition ${
                              errors.recipientEmail ? "border-red-500" : "border-gray-200"
                            }`}
                          />
                        </div>
                        {errors.recipientEmail && (
                          <p className="text-red-500 text-xs font-bold mt-1">{errors.recipientEmail}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">
                          We will email the ₹1,000 gift card code directly to this address.
                        </p>
                      </div>

                      {/* Personal Message */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label htmlFor="personalMessage" className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                            Personal Message <span className="text-gray-400 font-normal">(Optional)</span>
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
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Checkout trigger button */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
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
                        BUY NOW FOR ₹500 (GET ₹1,000 CREDIT)
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                    <span className="flex items-center gap-1">
                      <Lock size={12} /> PayGlocal 256-Bit SSL
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" /> Instant Email Delivery
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
