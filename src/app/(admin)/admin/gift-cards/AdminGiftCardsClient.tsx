"use client";

import React, { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  X,
  Search,
  Calendar,
  Tag,
  AlertCircle,
  Check,
  Copy,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

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
  createdAt: string;
  _count?: {
    giftCards: number;
  };
}

interface PurchasedCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  purchasedBy: string;
  purchasedAt: string;
  isRedeemed: boolean;
  isGift: boolean;
  recipientName: string | null;
  recipientEmail: string | null;
  sharedVia: string | null;
}

export default function AdminGiftCardsClient() {
  const [offers, setOffers] = useState<GiftCardOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<GiftCardOffer | null>(null);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [selectedOfferForPurchases, setSelectedOfferForPurchases] = useState<GiftCardOffer | null>(null);
  const [purchasedCards, setPurchasedCards] = useState<PurchasedCard[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    faceValue: "1000",
    sellingPrice: "500",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10),
    maxPurchases: "100",
    perUserLimit: "3",
    description: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  // Fetch offers
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gift-card-offers");
      const data = await res.json();
      if (data.success) {
        setOffers(data.offers);
      } else {
        toast.error(data.error || "Failed to load gift card offers");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setForm({
      name: "",
      faceValue: "1000",
      sellingPrice: "500",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10),
      maxPurchases: "100",
      perUserLimit: "3",
      description: "Get ₹1000 value for just ₹500!",
      isActive: true,
    });
    setIsOfferModalOpen(true);
  };

  const handleOpenEditModal = (offer: GiftCardOffer) => {
    setEditingOffer(offer);
    setForm({
      name: offer.name,
      faceValue: String(offer.faceValue),
      sellingPrice: String(offer.sellingPrice),
      startDate: new Date(offer.startDate).toISOString().slice(0, 10),
      endDate: new Date(offer.endDate).toISOString().slice(0, 10),
      maxPurchases: offer.maxPurchases ? String(offer.maxPurchases) : "",
      perUserLimit: String(offer.perUserLimit),
      description: offer.description || "",
      isActive: offer.isActive,
    });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.faceValue || !form.sellingPrice || !form.startDate || !form.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        faceValue: Number(form.faceValue),
        sellingPrice: Number(form.sellingPrice),
        startDate: form.startDate,
        endDate: form.endDate,
        maxPurchases: form.maxPurchases ? Number(form.maxPurchases) : null,
        perUserLimit: Number(form.perUserLimit || 3),
        description: form.description.trim() || null,
        isActive: form.isActive,
      };

      const url = editingOffer
        ? `/api/admin/gift-card-offers/${editingOffer.id}`
        : "/api/admin/gift-card-offers";

      const method = editingOffer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(editingOffer ? "Offer updated successfully!" : "New Gift Card Offer created!");
        setIsOfferModalOpen(false);
        fetchOffers();
      } else {
        toast.error(data.error || "Failed to save offer");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network error while saving offer");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOfferActive = async (offer: GiftCardOffer) => {
    try {
      const res = await fetch(`/api/admin/gift-card-offers/${offer.id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.isActive ? `"${offer.name}" activated!` : `"${offer.name}" deactivated!`
        );
        fetchOffers();
      } else {
        toast.error(data.error || "Failed to toggle offer");
      }
    } catch (e) {
      toast.error("Error toggling offer state");
    }
  };

  const handleViewPurchases = async (offer: GiftCardOffer) => {
    setSelectedOfferForPurchases(offer);
    setIsPurchasesModalOpen(true);
    setLoadingPurchases(true);
    try {
      const res = await fetch(`/api/admin/gift-card-offers/${offer.id}/purchases`);
      const data = await res.json();
      if (data.success) {
        setPurchasedCards(data.giftCards);
      } else {
        toast.error(data.error || "Failed to load purchases");
      }
    } catch (e) {
      toast.error("Error fetching purchase records");
    } finally {
      setLoadingPurchases(false);
    }
  };

  const filteredOffers = offers.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
              <Gift size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                Gift Card Offers Management
              </h1>
              <p className="text-xs text-gray-500 font-semibold">
                Create, monitor, and control customer gift card promotional offers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOffers}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-xs"
            title="Refresh List"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Create New Offer
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
          />
        </div>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
          Total Offers: {filteredOffers.length}
        </span>
      </div>

      {/* Offers List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-3xl">
          <RefreshCw size={32} className="animate-spin text-[#A0463E] mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loading Gift Card Offers...
          </p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center space-y-4">
          <Gift size={48} className="mx-auto text-gray-300" />
          <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wide">
            No Gift Card Offers Found
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Get started by creating your first promotional offer to attract buyers!
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} /> Create Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const now = new Date();
            const isExpired = new Date(offer.endDate) < now;
            const isFuture = new Date(offer.startDate) > now;
            const isSoldOut = offer.maxPurchases !== null && offer.totalSold >= offer.maxPurchases;
            const isCurrentlyActive = offer.isActive && !isExpired && !isFuture && !isSoldOut;

            return (
              <div
                key={offer.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm space-y-5 relative transition-all hover:shadow-md ${
                  isCurrentlyActive ? "border-gray-200" : "border-red-200 bg-red-50/20"
                }`}
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCurrentlyActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isExpired
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : isSoldOut
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {isCurrentlyActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          🟢 ACTIVE
                        </>
                      ) : isExpired ? (
                        "🔴 EXPIRED"
                      ) : isSoldOut ? (
                        "🔥 SOLD OUT"
                      ) : !offer.isActive ? (
                        "⏸️ DISABLED"
                      ) : (
                        "⏳ UPCOMING"
                      )}
                    </span>

                    <h3 className="text-base font-extrabold text-gray-900 tracking-wide pt-1">
                      {offer.name}
                    </h3>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleOfferActive(offer)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      offer.isActive ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                    title={offer.isActive ? "Disable Offer" : "Enable Offer"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        offer.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Offer Pricing Details */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Face Value
                    </span>
                    <span className="text-base font-black text-gray-900">
                      ₹{offer.faceValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Selling Price
                    </span>
                    <span className="text-base font-black text-[#A0463E]">
                      ₹{offer.sellingPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Offer Metadata */}
                <div className="space-y-2 text-xs text-gray-600 font-medium border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Calendar size={14} /> Active Dates:
                    </span>
                    <span className="font-bold text-gray-800">
                      {new Date(offer.startDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(offer.endDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Tag size={14} /> Sold / Limit:
                    </span>
                    <span className="font-bold text-gray-900">
                      {offer.totalSold} / {offer.maxPurchases !== null ? offer.maxPurchases : "∞"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Users size={14} /> Per User Limit:
                    </span>
                    <span className="font-bold text-gray-900">{offer.perUserLimit} max</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenEditModal(offer)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    <Edit2 size={14} /> Edit
                  </button>

                  <button
                    onClick={() => handleViewPurchases(offer)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#A0463E]/10 hover:bg-[#A0463E] text-[#A0463E] hover:text-white text-xs font-bold py-2.5 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    <Eye size={14} /> Purchases ({offer.totalSold})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Gift size={20} className="text-[#A0463E]" />
                {editingOffer ? "Edit Gift Card Offer" : "Create New Gift Card Offer"}
              </h2>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  Offer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Independence Day Offer"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    Face Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.faceValue}
                    onChange={(e) => setForm((prev) => ({ ...prev, faceValue: e.target.value }))}
                    placeholder="1000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                    placeholder="500"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    Max Purchases <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={form.maxPurchases}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxPurchases: e.target.value }))}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    value={form.perUserLimit}
                    onChange={(e) => setForm((prev) => ({ ...prev, perUserLimit: e.target.value }))}
                    placeholder="3"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  Offer Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Get ₹1000 value for just ₹500!"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#A0463E] rounded border-gray-300 focus:ring-[#A0463E]"
                />
                <label htmlFor="isActive" className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  Active Immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#A0463E] hover:bg-black text-white text-xs font-extrabold px-6 py-2.5 rounded-xl uppercase tracking-widest transition-all"
                >
                  {saving ? "Saving..." : "Save Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PURCHASES LIST MODAL ================= */}
      {isPurchasesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                  Purchases: {selectedOfferForPurchases?.name}
                </h2>
                <p className="text-xs text-gray-500">
                  Total Sold: {purchasedCards.length} cards
                </p>
              </div>
              <button
                onClick={() => setIsPurchasesModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {loadingPurchases ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                Loading purchase records...
              </div>
            ) : purchasedCards.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 uppercase tracking-wider">
                No gift cards sold under this offer yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Buyer Email</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Purchased At</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Shared Via</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {purchasedCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-[#A0463E]">
                          {card.code}
                        </td>
                        <td className="py-3 px-4 text-gray-800">{card.purchasedBy}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {card.isGift ? `${card.recipientName || "Recipient"} (${card.recipientEmail})` : "Self"}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(card.purchasedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          ₹{card.balance} / ₹{card.value}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              card.isRedeemed || card.balance === 0
                                ? "bg-gray-100 text-gray-500"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {card.isRedeemed || card.balance === 0 ? "Redeemed" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] text-gray-400 font-bold">
                          {card.sharedVia || "Email"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
