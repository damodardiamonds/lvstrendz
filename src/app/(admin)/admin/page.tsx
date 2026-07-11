
import { Package, ShoppingCart, IndianRupee, AlertTriangle } from "lucide-react";
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
    totalOrders = await db.order.count();
    const revenue = await db.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    });
    totalRevenue = Number(revenue._sum.total) || 0;
  } catch {
    // Orders table may not exist yet
  }

  return {
    totalProducts,
    totalVariants,
    lowStockVariants,
    totalOrders,
    totalRevenue,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`${stats.totalVariants} variants`}
          icon={Package}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
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
          </a>
          <a
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
          </a>
          <a
            href="/admin/variants"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all group"
          >
            <AlertTriangle
              size={20}
              className="text-gray-400 group-hover:text-[#A0463E]"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#A0463E]">
              Manage Stock
            </span>
          </a>
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
            <a
              href="/admin/variants?filter=low-stock"
              className="underline ml-1 font-medium"
            >
              View all →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

