"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { shareGiftCardWhatsApp, nativeShare } from "@/lib/shareGiftCard";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Mail,
  ArrowRight,
  ShoppingBag,
  Gift,
  Sparkles,
} from "lucide-react";

export default function GiftCardSuccessClient() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "LVS-DEMO8K2M";
  const valueStr = searchParams.get("value") || "1000";
  const value = Number(valueStr);
  const senderName = searchParams.get("senderName") || "A friend";
  const recipientName = searchParams.get("recipientName") || "";
  const recipientEmail = searchParams.get("recipientEmail") || "";
  const recipientPhone = searchParams.get("recipientPhone") || "";

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Gift card code copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    shareGiftCardWhatsApp({
      code,
      senderName,
      value,
      recipientPhone,
    });
  };

  const handleNativeShare = async () => {
    await nativeShare({
      code,
      senderName,
      value,
    });
  };

  return (
    <main className="bg-white min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-8 animate-fadeIn">
        {/* Top Checkmark Header */}
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-100">
          <CheckCircle2 size={44} />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#A0463E] bg-red-50 px-3 py-1 rounded-full border border-red-100">
            Order Confirmed
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-3 mb-2 uppercase tracking-wide">
            🎉 Gift Card Purchased Successfully!
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {recipientEmail
              ? `Your ₹${value.toLocaleString("en-IN")} gift card code has been generated and emailed to ${recipientEmail}!`
              : `Your ₹${value.toLocaleString("en-IN")} gift card code is ready to use or share.`}
          </p>
        </div>

        {/* Card Display Box */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#3f3f46] p-8 text-white shadow-2xl border border-gray-700 text-left space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black tracking-widest uppercase text-white">LVS TRENDZ</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Digital Luxury Gift Card</p>
            </div>
            <span className="bg-[#A0463E] text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
              ₹{value.toLocaleString("en-IN")} VALUE
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center space-y-1">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              YOUR GIFT CARD CODE
            </p>
            <div className="text-2xl md:text-3xl font-black font-mono text-[#fb7185] tracking-widest">
              {code}
            </div>
          </div>

          <div className="flex justify-between items-end text-xs text-gray-300 pt-2 border-t border-white/10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Balance</span>
              <span className="font-bold text-emerald-400">₹{value.toLocaleString("en-IN")}</span>
            </div>
            {recipientName && (
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block">For</span>
                <span className="font-bold text-white">{recipientName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sharing Options */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            Share This Gift Card
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp Share Button (#25D366) */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.124.555 4.197 1.611 6.02L0 24l6.166-1.617A11.968 11.968 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.031S18.677 0 12.031 0zm.01 21.84c-1.807 0-3.578-.485-5.127-1.403l-.367-.218-3.663.96.977-3.571-.24-.38A9.878 9.878 0 012.16 12.03c0-5.441 4.428-9.87 9.88-9.87 5.452 0 9.88 4.429 9.88 9.87 0 5.442-4.428 9.87-9.879 9.87zm5.415-7.404c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.569-.347z" />
              </svg>
              Send via WhatsApp
            </button>

            {/* Native Share Button */}
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all shadow-sm"
            >
              <Share2 size={18} /> Share Card
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Copy Code */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-extrabold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all border border-gray-200"
            >
              {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy Code"}
            </button>

            {/* Shop Link */}
            <Link
              href="/shop"
              className="w-full flex items-center justify-center gap-2 bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all shadow-sm"
            >
              Start Shopping <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <Link
          href="/gift-card"
          className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider underline block pt-2"
        >
          Buy Another Gift Card
        </Link>
      </div>
    </main>
  );
}
