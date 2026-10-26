
import { Package, ShoppingCart, IndianRupee, AlertTriangle, Gift, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import StatCard from "./components/StatCard";

async function getDashboardStats() {
  const [totalProducts, totalVariants, lowStockVariants] = await Promise.all([
    db.product.count(),
    db.variant.count(),
    db.variant.count({
      where: { stock: { lte: 5 } },
    }),
  ]);

  // Order stats (graceful if orders table doesn't exist yet)
  let totalOrders = 0;
  let totalRevenue = 0;

  try {
    totalOrders = await db.order.count({
      where: {
        paymentStatus: "PAID",
      },
    });
    const revenue = await db.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
      },
    });
    totalRevenue = Number(revenue._sum.total) || 0;
  } catch {
    // Orders table may not exist yet
  }

  // Active Carts stats
  let activeCartItemsCount = 0;
  let activeCartShoppersCount = 0;
  try {
    const activeCarts = await db.cartItem.findMany({
      where: { status: "ACTIVE" },
      select: { sessionId: true, quantity: true },
    });
    activeCartItemsCount = activeCarts.reduce((acc, c) => acc + c.quantity, 0);
    activeCartShoppersCount = new Set(activeCarts.map((c) => c.sessionId)).size;
  } catch {
    // Cart table may not exist yet
  }

  return {
    totalProducts,
    totalVariants,
    lowStockVariants,
    totalOrders,
    totalRevenue,
    activeCartItemsCount,
    activeCartShoppersCount,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`${stats.totalVariants} variants`}
          icon={Package}
        />
        <StatCard
          title="Active Carts"
          value={`${stats.activeCartShoppersCount} shoppers`}
          subtitle={`${stats.activeCartItemsCount} items currently in cart`}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle="All time"
          icon={ShoppingCart}
        />
        <StatCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          subtitle="Excluding cancelled"
          icon={IndianRupee}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockVariants}
          subtitle="≤ 5 units remaining"
          icon={AlertTriangle}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/admin/cart"
            className="flex items-center gap-3 p-4 rounded-lg border border-[#A0463E]/20 bg-[#A0463E]/5 hover:bg-[#A0463E]/10 hover:border-[#A0463E] transition-all group"
          >
            <ShoppingBag
              size={20}
              className="text-[#A0463E]"
            />
            <span className="text-sm font-semibold text-[#A0463E]">
              Cart Activity & Demand
            </span>
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all group"
          >
            <Package
              size={20}
              className="text-gray-400 group-hover:text-[#A0463E]"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#A0463E]">
              Add New Product
            </span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all group"
          >
            <ShoppingCart
              size={20}
              className="text-gray-400 group-hover:text-[#A0463E]"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#A0463E]">
              View Orders
            </span>
          </Link>
          <Link
            href="/admin/gift-cards"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all group"
          >
            <Gift
              size={20}
              className="text-gray-400 group-hover:text-[#A0463E]"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#A0463E]">
              Gift Card Offers
            </span>
          </Link>
          <Link
            href="/admin/attributes"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all group"
          >
            <AlertTriangle
              size={20}
              className="text-gray-400 group-hover:text-[#A0463E]"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#A0463E]">
              Attributes & Stock
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Low Stock Items */}
      {stats.lowStockVariants > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle size={16} />
            Low Stock Warning
          </h3>
          <p className="text-sm text-red-600 mt-1">
            {stats.lowStockVariants} variant(s) have 5 or fewer units in stock.
            <Link
              href="/admin/attributes"
              className="underline ml-1 font-medium"
            >
              View all →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

