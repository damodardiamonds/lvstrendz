"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  RefreshCw,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  MinusCircle,
  Eye,
  TrendingUp,
  Sparkles,
  Smartphone,
  Laptop,
} from "lucide-react";

interface ProductDemandItem {
  productId: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  image: string | null;
  stock: number;
  peopleCount: number; // Distinct active shoppers currently holding in cart
  allTimePeopleCount: number; // Total people who added this product over time
  activeUnits: number;
  allTimeUnits: number;
  activeValue: number;
  sizeBreakdown: Record<string, number>;
  shoppers: Array<{
    sessionId: string;
    name: string;
    email: string | null;
    phone: string | null;
    quantity: number;
    size: string | null;
    color: string | null;
    addedAt: string;
  }>;
}

interface CartEventItem {
  id: string;
  eventType: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  customerName: string;
  customerEmail?: string | null;
  sessionId: string;
  createdAt: string;
  userAgent?: string | null;
}

interface ActiveSessionItem {
  sessionId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    image: string | null;
    price: number;
    quantity: number;
    size: string | null;
    color: string | null;
  }>;
  totalValue: number;
  totalUnits: number;
}

interface CartDataResponse {
  summary: {
    totalActiveCartUnits: number;
    totalUniqueProductsInCarts: number;
    totalActiveShoppers: number;
    totalPotentialValue: number;
    todayAdditionsCount: number;
    allTimeAdditionsCount: number;
  };
  productDemand: ProductDemandItem[];
  activeSessions: ActiveSessionItem[];
  recentEvents: CartEventItem[];
}

export default function AdminCartPage() {
  const [data, setData] = useState<CartDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<"all" | "today" | "week" | "month">("all");
  const [activeTab, setActiveTab] = useState<"demand" | "feed" | "sessions">("demand");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"people" | "allTime" | "units" | "value" | "stock">("people");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setLoading(true);
      try {
        const res = await fetch(`/api/admin/cart?time=${timeRange}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLastRefreshed(new Date());
        }
      } catch (err) {
        console.error("Failed to load cart data:", err);
      } finally {
        setLoading(false);
      }
    },
    [timeRange]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Filter & sort products
  const filteredProducts = (data?.productDemand || [])
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "people") return b.peopleCount - a.peopleCount;
      if (sortBy === "allTime") return b.allTimePeopleCount - a.allTimePeopleCount;
      if (sortBy === "units") return b.activeUnits - a.activeUnits;
      if (sortBy === "value") return b.activeValue - a.activeValue;
      if (sortBy === "stock") return a.stock - b.stock;
      return 0;
    });

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getDeviceIcon = (ua?: string | null) => {
    if (!ua) return null;
    const isMobile = /mobile|iphone|android/i.test(ua);
    return isMobile ? (
      <Smartphone size={13} className="text-gray-400" />
    ) : (
      <Laptop size={13} className="text-gray-400" />
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A0463E]/10 flex items-center justify-center text-[#A0463E]">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Cart Activity & Product Demand
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Monitor
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time insights: which products are added in cart and how many people have added them.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:self-auto self-start flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-medium text-gray-600">
            {(["all", "today", "week", "month"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                  timeRange === t
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                {t === "all" ? "All Time" : t === "week" ? "Last 7D" : t === "month" ? "Last 30D" : "Today"}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 shadow-sm transition-all"
            title="Refresh cart data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#A0463E]" : ""} />
            <span>Refresh</span>
          </button>

          <label className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-[#A0463E] focus:ring-[#A0463E] h-3.5 w-3.5"
            />
            <span className="hidden sm:inline">Auto-refresh (15s)</span>
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Shoppers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Shoppers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">
              {data?.summary.totalActiveShoppers || 0}
            </span>
            <span className="text-xs text-gray-500 ml-1.5">shoppers</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Currently have items in their cart</p>
        </div>

        {/* Products in Carts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Products in Carts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">
              {data?.summary.totalUniqueProductsInCarts || 0}
            </span>
            <span className="text-xs text-gray-500 ml-1.5">
              ({data?.summary.totalActiveCartUnits || 0} units)
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Unique products added by visitors</p>
        </div>

        {/* Potential Cart Value */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Potential Cart Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-700">
              ₹{(data?.summary.totalPotentialValue || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Total value sitting in active carts</p>
        </div>

        {/* Today's Cart Additions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Today's Add-to-Carts
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#A0463E] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#A0463E]">
              {data?.summary.todayAdditionsCount || 0}
            </span>
            <span className="text-xs text-gray-500 ml-1.5">
              ({data?.summary.allTimeAdditionsCount || 0} all-time)
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Cart additions recorded today</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab("demand")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "demand"
              ? "border-[#A0463E] text-[#A0463E] bg-[#A0463E]/5"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Package size={15} />
          <span>Product Demand & Shopper Count</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
            {filteredProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "feed"
              ? "border-[#A0463E] text-[#A0463E] bg-[#A0463E]/5"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Clock size={15} />
          <span>Live Activity Feed</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
            {data?.recentEvents.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
            activeTab === "sessions"
              ? "border-[#A0463E] text-[#A0463E] bg-[#A0463E]/5"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users size={15} />
          <span>Active Shopper Carts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
            {data?.activeSessions.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: PRODUCT DEMAND & SHOPPER COUNT */}
      {activeTab === "demand" && (
        <div className="space-y-4">
          {/* Search & Sort Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#A0463E] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#A0463E]"
              >
                <option value="people">Most People Holding in Cart</option>
                <option value="allTime">Most People Added (All Time)</option>
                <option value="units">Highest Active Units in Cart</option>
                <option value="value">Highest Cart Value</option>
                <option value="stock">Lowest Available Stock</option>
              </select>
            </div>
          </div>

          {/* Products List Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4 text-center">People Added to Cart</th>
                    <th className="py-3 px-4 text-center">Units in Carts</th>
                    <th className="py-3 px-4 text-center">Inventory Stock</th>
                    <th className="py-3 px-4 text-right">Potential Value</th>
                    <th className="py-3 px-4 text-center">Shopper Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-700">No cart items found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          When shoppers add products to their cart, they will appear here in real-time.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isExpanded = expandedProductId === product.productId;
                      const hasLowStock =
                        product.stock <= 5 && product.activeUnits > 0;
                      const exceedsStock =
                        product.activeUnits > product.stock && product.stock >= 0;

                      return (
                        <tr
                          key={product.productId}
                          className="hover:bg-gray-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-14 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/product/${product.slug}`}
                                  target="_blank"
                                  className="font-semibold text-gray-900 hover:text-[#A0463E] transition-colors flex items-center gap-1"
                                >
                                  <span className="truncate max-w-[220px]">
                                    {product.name}
                                  </span>
                                  <ExternalLink size={12} className="text-gray-400" />
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5 text-gray-500 text-[11px]">
                                  {product.sku && <span>SKU: {product.sku}</span>}
                                  <span>•</span>
                                  <span className="font-medium text-gray-800">
                                    ₹{product.price.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                {/* Size breakdown pills */}
                                {Object.keys(product.sizeBreakdown).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {Object.entries(product.sizeBreakdown).map(
                                      ([size, count]) => (
                                        <span
                                          key={size}
                                          className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium"
                                        >
                                          {size}: {count}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* People Added to Cart */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#A0463E]/10 text-[#A0463E] border border-[#A0463E]/20">
                                <Users size={13} />
                                {product.peopleCount} {product.peopleCount === 1 ? "person" : "people"}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-1">
                                {product.allTimePeopleCount} all-time
                              </span>
                            </div>
                          </td>

                          {/* Units in Carts */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-sm font-bold text-gray-900">
                              {product.activeUnits}
                            </span>
                            <span className="text-[11px] text-gray-500 ml-1">units</span>
                            <div className="text-[10px] text-gray-400">
                              ({product.allTimeUnits} total added)
                            </div>
                          </td>

                          {/* Inventory Stock */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  product.stock === 0
                                    ? "bg-rose-100 text-rose-800"
                                    : product.stock <= 5
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {product.stock === 0
                                  ? "Out of Stock"
                                  : `${product.stock} in stock`}
                              </span>

                              {exceedsStock && (
                                <span className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-1">
                                  <AlertTriangle size={11} />
                                  Demand &gt; Stock
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Potential Value */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-sm font-bold text-emerald-700">
                              ₹{product.activeValue.toLocaleString("en-IN")}
                            </span>
                          </td>

                          {/* Action / View Shoppers */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() =>
                                setExpandedProductId(
                                  isExpanded ? null : product.productId
                                )
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isExpanded
                                  ? "bg-[#A0463E] text-white shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <span>{product.shoppers.length} Shoppers</span>
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Shoppers Expanded Detail View */}
            {expandedProductId && (
              <div className="bg-gray-50 border-t border-gray-200 p-5">
                {(() => {
                  const prod = filteredProducts.find(
                    (p) => p.productId === expandedProductId
                  );
                  if (!prod) return null;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          Shoppers who have "{prod.name}" in cart ({prod.shoppers.length}):
                        </h4>
                        <button
                          onClick={() => setExpandedProductId(null)}
                          className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                        >
                          Close ✕
                        </button>
                      </div>

                      {prod.shoppers.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">
                          No active shopper holds this product in their cart currently (it was added historically or has been ordered/removed).
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {prod.shoppers.map((shopper, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900 text-xs">
                                  {shopper.name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {formatTimeAgo(shopper.addedAt)}
                                </span>
                              </div>
                              {shopper.email && (
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                  {shopper.email}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px]">
                                <span className="text-gray-600">
                                  Quantity: <strong>{shopper.quantity}</strong>
                                </span>
                                {shopper.size && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 text-[10px] font-medium">
                                    Size {shopper.size}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ACTIVITY FEED */}
      {activeTab === "feed" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Live Add-to-Cart Activity Feed
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chronological real-time audit trail of shopper cart actions
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
              Latest 50 events
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {!data?.recentEvents || data.recentEvents.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No events recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  When visitors add or update items in their cart, live events will stream here.
                </p>
              </div>
            ) : (
              data.recentEvents.map((ev) => {
                const isAdd = ev.eventType === "ADD";
                const isRemove = ev.eventType === "REMOVE";
                const isOrdered = ev.eventType === "ORDERED";
                const isUpdate = ev.eventType === "UPDATE_QTY";

                return (
                  <div
                    key={ev.id}
                    className="py-3.5 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors px-2 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-10 h-12 relative bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200 mt-0.5">
                        {ev.productImage ? (
                          <Image
                            src={ev.productImage}
                            alt={ev.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={14} />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isAdd
                                ? "bg-emerald-100 text-emerald-800"
                                : isOrdered
                                ? "bg-purple-100 text-purple-800"
                                : isRemove
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isAdd
                              ? "Added to Cart"
                              : isOrdered
                              ? "Checked Out"
                              : isRemove
                              ? "Removed"
                              : "Quantity Changed"}
                          </span>
                          <span className="font-semibold text-gray-900 text-xs">
                            {ev.productName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span className="font-medium text-gray-800">
                            {ev.customerName}
                          </span>
                          {ev.customerEmail && (
                            <span className="text-gray-400">({ev.customerEmail})</span>
                          )}
                          <span>•</span>
                          <span>Qty: {ev.quantity}</span>
                          {ev.size && <span>• Size: {ev.size}</span>}
                          {ev.price > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-gray-900">
                                ₹{(ev.price * (ev.quantity || 1)).toLocaleString("en-IN")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium text-gray-500">
                        {formatTimeAgo(ev.createdAt)}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-gray-400">
                        {getDeviceIcon(ev.userAgent)}
                        <span>{new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE SHOPPER SESSIONS */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Active Shopper Sessions
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live shoppers who currently have items inside their cart
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {data?.activeSessions.length || 0} active carts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!data?.activeSessions || data.activeSessions.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-gray-500">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">No active shopper sessions</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Carts with active items will appear here grouped by shopper.
                  </p>
                </div>
              ) : (
                data.activeSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="border border-gray-200 rounded-xl p-4 bg-white shadow-xs hover:border-[#A0463E]/40 transition-all"
                  >
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="font-bold text-gray-900 text-xs">
                            {session.customerName}
                          </h3>
                        </div>
                        {session.customerEmail && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {session.customerEmail}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          ID: {session.sessionId.substring(0, 16)}...
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700">
                          ₹{session.totalValue.toLocaleString("en-IN")}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Active {formatTimeAgo(session.lastActiveAt)}
                        </div>
                      </div>
                    </div>

                    {/* Cart Items in this session */}
                    <div className="space-y-2">
                      {session.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs bg-gray-50/70 p-2 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-10 relative bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package size={12} />
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="font-medium text-gray-800 truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                Qty: {item.quantity} {item.size && `• Size ${item.size}`}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 text-xs">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
