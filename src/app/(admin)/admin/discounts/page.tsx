"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Gift,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

type TabType = "coupons" | "gift-cards" | "timer";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface GiftCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  purchasedBy?: string;
  isRedeemed?: boolean;
  isGift?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  createdAt: string;
}

interface TimerSettings {
  isActive: boolean;
  tagline: string;
  title: string;
  endDate: string;
  buttonText: string;
  buttonLink: string;
  bannerImage: string;
}

export default function DiscountsAndTimerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("coupons");

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [searchCoupon, setSearchCoupon] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    isActive: true,
    startsAt: "",
    expiresAt: "",
  });

  // Gift Cards State
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loadingGiftCards, setLoadingGiftCards] = useState(true);
  const [searchGiftCard, setSearchGiftCard] = useState("");
  const [isGiftCardModalOpen, setIsGiftCardModalOpen] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);
  const [giftCardForm, setGiftCardForm] = useState({
    code: "",
    value: "",
    balance: "",
    purchasedBy: "",
  });

  // Timer Settings State
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    isActive: true,
    tagline: "Flat 20% OFF",
    title: "Limited Time Offer! Don't Miss Out!",
    endDate: new Date(Date.now() + 15 * 86400 * 1000).toISOString().slice(0, 16),
    buttonText: "Shop Now →",
    buttonLink: "/shop",
    bannerImage: "https://res.cloudinary.com/n5umtsub/image/upload/v1785663378/lvstrendz/hero/slide-2.webp",
  });
  const [loadingTimer, setLoadingTimer] = useState(true);
  const [savingTimer, setSavingTimer] = useState(false);

  // Copy state helper
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied ${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        toast.error(data.error || "Failed to load coupons");
      }
    } catch (e) {
      toast.error("Error fetching coupons");
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Fetch Gift Cards
  const fetchGiftCards = async () => {
    setLoadingGiftCards(true);
    try {
      const res = await fetch("/api/admin/gift-cards");
      const data = await res.json();
      if (data.success) {
        setGiftCards(data.giftCards || []);
      } else {
        toast.error(data.error || "Failed to load gift cards");
      }
    } catch (e) {
      toast.error("Error fetching gift cards");
    } finally {
      setLoadingGiftCards(false);
    }
  };

  // Fetch Timer Settings
  const fetchTimerSettings = async () => {
    setLoadingTimer(true);
    try {
      const res = await fetch("/api/admin/timer-settings");
      const data = await res.json();
      if (data.success && data.settings) {
        const endDateFormatted = data.settings.endDate
          ? new Date(data.settings.endDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 15 * 86400 * 1000).toISOString().slice(0, 16);
        setTimerSettings({
          ...data.settings,
          endDate: endDateFormatted,
        });
      }
    } catch (e) {
      toast.error("Error fetching timer settings");
    } finally {
      setLoadingTimer(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchGiftCards();
    fetchTimerSettings();
  }, []);

  // ---------- COUPON ACTIONS ----------
  const handleOpenCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        type: coupon.type,
        value: String(coupon.value),
        minOrderValue: coupon.minOrderValue !== null ? String(coupon.minOrderValue) : "",
        maxDiscount: coupon.maxDiscount !== null ? String(coupon.maxDiscount) : "",
        usageLimit: coupon.usageLimit !== null ? String(coupon.usageLimit) : "",
        isActive: coupon.isActive,
        startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        type: "PERCENTAGE",
        value: "",
        minOrderValue: "",
        maxDiscount: "",
        usageLimit: "",
        isActive: true,
        startsAt: "",
        expiresAt: "",
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.value) {
      toast.error("Please fill in Code and Value");
      return;
    }

    try {
      const payload = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        ...couponForm,
      };

      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCoupon ? "Coupon updated!" : "Coupon created!");
        setIsCouponModalOpen(false);
        fetchCoupons();
      } else {
        toast.error(data.error || "Failed to save coupon");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${!coupon.isActive ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to delete coupon");
    }
  };

  // ---------- GIFT CARD ACTIONS ----------
  const generateGiftCardCode = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGiftCardForm((prev) => ({
      ...prev,
      code: `GIFT-${randomHex}-${randomHex2}`,
    }));
  };

  const handleOpenGiftCardModal = (card?: GiftCard) => {
    if (card) {
      setEditingGiftCard(card);
      setGiftCardForm({
        code: card.code,
        value: String(card.value),
        balance: String(card.balance),
        purchasedBy: card.purchasedBy || "",
      });
    } else {
      setEditingGiftCard(null);
      setGiftCardForm({
        code: `LVS-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        value: "1000",
        balance: "1000",
        purchasedBy: "admin@lvstrendz.com",
      });
    }
    setIsGiftCardModalOpen(true);
  };

  const handleSaveGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardForm.code || !giftCardForm.value) {
      toast.error("Please fill in Code and Value");
      return;
    }

    try {
      const payload = {
        ...(editingGiftCard ? { id: editingGiftCard.id } : {}),
        code: giftCardForm.code,
        value: giftCardForm.value,
        balance: giftCardForm.balance !== "" ? giftCardForm.balance : giftCardForm.value,
        purchasedBy: giftCardForm.purchasedBy || "Admin",
      };

      const res = await fetch("/api/admin/gift-cards", {
        method: editingGiftCard ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingGiftCard ? "Gift Card updated!" : "Gift Card issued!");
        setIsGiftCardModalOpen(false);
        fetchGiftCards();
      } else {
        toast.error(data.error || "Failed to save gift card");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleToggleGiftCardActive = async (card: GiftCard) => {
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, isActive: !card.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Gift Card ${!card.isActive ? "activated" : "deactivated"}`);
        fetchGiftCards();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteGiftCard = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;
    try {
      const res = await fetch(`/api/admin/gift-cards?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Gift card deleted");
        fetchGiftCards();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to delete gift card");
    }
  };

  // ---------- TIMER SETTINGS SAVE ----------
  const handleSaveTimerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTimer(true);
    try {
      const payload = {
        ...timerSettings,
        endDate: new Date(timerSettings.endDate).toISOString(),
      };

      const res = await fetch("/api/admin/timer-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Footer countdown timer settings saved!");
      } else {
        toast.error(data.error || "Failed to save timer settings");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSavingTimer(false);
    }
  };

  // Filter lists
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchCoupon.toLowerCase()) ||
      c.type.toLowerCase().includes(searchCoupon.toLowerCase())
  );

  const filteredGiftCards = giftCards.filter((g) =>
    g.code.toLowerCase().includes(searchGiftCard.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-[#A0463E]" size={24} />
            Discounts, Offers & Footer Timer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount coupons, customer gift cards, and the dynamic homepage countdown banner.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-6 bg-white px-6 pt-2 rounded-t-xl shadow-sm">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "coupons"
              ? "border-[#A0463E] text-[#A0463E]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Tag size={18} />
          Coupon Codes ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab("gift-cards")}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "gift-cards"
              ? "border-[#A0463E] text-[#A0463E]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Gift size={18} />
          Gift Cards ({giftCards.length})
        </button>

        <button
          onClick={() => setActiveTab("timer")}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "timer"
              ? "border-[#A0463E] text-[#A0463E]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock size={18} />
          Footer Countdown Timer
        </button>
      </div>

      {/* TAB 1: COUPONS */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search coupon code..."
                value={searchCoupon}
                onChange={(e) => setSearchCoupon(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={fetchCoupons}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                title="Refresh"
              >
                <RefreshCw size={18} className={loadingCoupons ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => handleOpenCouponModal()}
                className="bg-[#A0463E] hover:bg-[#883932] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <Plus size={18} />
                Create Coupon
              </button>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingCoupons ? (
              <div className="p-8 text-center text-gray-500">Loading coupons...</div>
            ) : filteredCoupons.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Tag size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-gray-600">No coupon codes found</p>
                <p className="text-xs text-gray-400 mt-1">Create your first discount coupon above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min. Purchase</th>
                      <th className="py-3 px-4">Max. Discount</th>
                      <th className="py-3 px-4">Usage Count</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCoupons.map((coupon) => {
                      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-gray-900 px-2.5 py-1 rounded border border-gray-200">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => handleCopy(coupon.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy code"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                coupon.type === "PERCENTAGE"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "None"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : "Unlimited"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {coupon.expiresAt ? (
                              <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                                {new Date(coupon.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              "No Expiry"
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleCouponActive(coupon)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                                coupon.isActive && !isExpired
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                              }`}
                            >
                              {coupon.isActive && !isExpired ? (
                                <>
                                  <CheckCircle2 size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenCouponModal(coupon)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GIFT CARDS */}
      {activeTab === "gift-cards" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search gift card code..."
                value={searchGiftCard}
                onChange={(e) => setSearchGiftCard(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={fetchGiftCards}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                title="Refresh"
              >
                <RefreshCw size={18} className={loadingGiftCards ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => handleOpenGiftCardModal()}
                className="bg-[#A0463E] hover:bg-[#883932] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <Gift size={18} />
                Issue Gift Card
              </button>
            </div>
          </div>

          {/* Gift Cards Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingGiftCards ? (
              <div className="p-8 text-center text-gray-500">Loading gift cards...</div>
            ) : filteredGiftCards.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Gift size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-gray-600">No gift cards issued yet</p>
                <p className="text-xs text-gray-400 mt-1">Issue a gift card for discounts or customer rewards</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Gift Card Code</th>
                      <th className="py-3 px-4">Initial Value</th>
                      <th className="py-3 px-4">Current Balance</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGiftCards.map((card) => {
                      const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
                      const isDepleted = Number(card.balance) <= 0;
                      return (
                        <tr key={card.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded border border-amber-200">
                                {card.code}
                              </span>
                              <button
                                onClick={() => handleCopy(card.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy code"
                              >
                                {copiedCode === card.code ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-700">
                            ₹{Number(card.initialValue).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            ₹{Number(card.balance).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {card.expiresAt ? (
                              <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                                {new Date(card.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              "No Expiry"
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleGiftCardActive(card)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                                card.isActive && !isExpired && !isDepleted
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                              }`}
                            >
                              {card.isActive && !isExpired && !isDepleted ? (
                                <>
                                  <CheckCircle2 size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> {isDepleted ? "Used" : "Inactive"}
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenGiftCardModal(card)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteGiftCard(card.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FOOTER COUNTDOWN TIMER */}
      {activeTab === "timer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form Column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-[#A0463E]" size={20} />
                Manage Footer Time Counter
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Customize the countdown offer banner displayed right above the footer on your storefront.
              </p>
            </div>

            <form onSubmit={handleSaveTimerSettings} className="space-y-4">
              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">
                    Show Countdown Banner
                  </span>
                  <span className="text-xs text-gray-500">
                    Enable or disable the countdown timer above the homepage footer.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timerSettings.isActive}
                    onChange={(e) =>
                      setTimerSettings({ ...timerSettings, isActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A0463E]"></div>
                </label>
              </div>

              {/* Tagline / Subtitle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Offer Badge / Tagline
                </label>
                <input
                  type="text"
                  value={timerSettings.tagline}
                  onChange={(e) =>
                    setTimerSettings({ ...timerSettings, tagline: e.target.value })
                  }
                  placeholder="e.g. Flat 20% OFF"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              {/* Main Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Banner Headline Title
                </label>
                <input
                  type="text"
                  value={timerSettings.title}
                  onChange={(e) =>
                    setTimerSettings({ ...timerSettings, title: e.target.value })
                  }
                  placeholder="e.g. Limited Time Offer! Don't Miss Out!"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              {/* End Date & Time */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={14} /> Target Expiration Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={timerSettings.endDate}
                  onChange={(e) =>
                    setTimerSettings({ ...timerSettings, endDate: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={timerSettings.buttonText}
                    onChange={(e) =>
                      setTimerSettings({ ...timerSettings, buttonText: e.target.value })
                    }
                    placeholder="e.g. Shop Now →"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Button Target Link
                  </label>
                  <input
                    type="text"
                    value={timerSettings.buttonLink}
                    onChange={(e) =>
                      setTimerSettings({ ...timerSettings, buttonLink: e.target.value })
                    }
                    placeholder="e.g. /shop"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>
              </div>

              {/* Banner Image URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Right-Side Banner Image URL
                </label>
                <input
                  type="text"
                  value={timerSettings.bannerImage}
                  onChange={(e) =>
                    setTimerSettings({ ...timerSettings, bannerImage: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingTimer}
                  className="w-full bg-[#A0463E] hover:bg-[#883932] text-white py-3 rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  {savingTimer ? "Saving..." : "Save Timer Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Live Banner Preview
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                This preview reflects how the timer banner will be rendered to your customers above the footer.
              </p>

              {timerSettings.isActive ? (
                <div className="rounded-xl overflow-hidden shadow-sm bg-[#FAF0F2] border border-[#F2BDD4]/30 p-6 space-y-4">
                  <span className="text-[#A0463E] text-xs font-bold tracking-wider uppercase block">
                    {timerSettings.tagline || "Flat 20% OFF"}
                  </span>
                  <h4 className="text-lg font-extrabold text-gray-900 leading-snug">
                    {timerSettings.title || "Limited Time Offer!"}
                  </h4>

                  {/* Countdown Preview */}
                  <div className="flex gap-2">
                    {["Days", "Hours", "Mins", "Secs"].map((label, i) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-black rounded">
                          {["15", "23", "17", "59"][i]}
                        </div>
                        <span className="text-[9px] font-bold text-gray-600 mt-1 uppercase">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <span className="inline-block border border-black text-black px-4 py-1.5 text-xs font-bold uppercase rounded">
                      {timerSettings.buttonText || "Shop Now →"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm">
                  <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
                  Countdown banner is currently <strong className="text-gray-700">Inactive</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </h2>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.type}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        type: e.target.value as "PERCENTAGE" | "FIXED",
                      })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={couponForm.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 200"}
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 999"
                    value={couponForm.minOrderValue}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, minOrderValue: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={couponForm.maxDiscount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maxDiscount: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100 (Leave empty for unlimited)"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={couponForm.isActive}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-[#A0463E] focus:ring-[#A0463E] rounded"
                />
                <label htmlFor="couponActive" className="text-sm text-gray-700 font-medium">
                  Active immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A0463E] hover:bg-[#883932] text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT GIFT CARD MODAL */}
      {isGiftCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">
              {editingGiftCard ? "Edit Gift Card" : "Issue Gift Card"}
            </h2>

            <form onSubmit={handleSaveGiftCard} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Gift Card Code *
                  </label>
                  {!editingGiftCard && (
                    <button
                      type="button"
                      onClick={generateGiftCardCode}
                      className="text-xs text-[#A0463E] font-semibold hover:underline"
                    >
                      Auto-generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. GIFT-8829-991A"
                  value={giftCardForm.code}
                  onChange={(e) =>
                    setGiftCardForm({ ...giftCardForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Initial Value (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1000"
                    value={giftCardForm.initialValue}
                    onChange={(e) =>
                      setGiftCardForm({ ...giftCardForm, initialValue: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    Current Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Same as initial if new"
                    value={giftCardForm.balance}
                    onChange={(e) =>
                      setGiftCardForm({ ...giftCardForm, balance: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  value={giftCardForm.expiresAt}
                  onChange={(e) =>
                    setGiftCardForm({ ...giftCardForm, expiresAt: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="giftCardActive"
                  checked={giftCardForm.isActive}
                  onChange={(e) =>
                    setGiftCardForm({ ...giftCardForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-[#A0463E] focus:ring-[#A0463E] rounded"
                />
                <label htmlFor="giftCardActive" className="text-sm text-gray-700 font-medium">
                  Active immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsGiftCardModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A0463E] hover:bg-[#883932] text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Save Gift Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
