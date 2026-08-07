import { db } from "@/lib/db";
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import StatCard from "../components/StatCard";

export const dynamic = "force-dynamic";

async function getAnalyticsData() {
  const [
    totalProducts,
    totalVariants,
    inStockVariants,
    lowStockVariants,
    outOfStockVariants,
    totalCategories,
    categoriesWithCount,
  ] = await Promise.all([
    db.product.count(),
    db.variant.count(),
    db.variant.count({ where: { stock: { gt: 5 } } }),
    db.variant.count({ where: { stock: { lte: 5, gt: 0 } } }),
    db.variant.count({ where: { stock: 0 } }),
    db.category.count(),
    db.category.findMany({
      take: 6,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: "desc" },
      },
    }),
  ]);

  let totalOrders = 0;
  let paidOrders = 0;
  let totalRevenue = 0;
  let averageOrderValue = 0;
  let statusCounts: Record<string, number> = {
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    PENDING: 0,
  };
  let recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    customerName: string;
  }> = [];

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
      take: 50,
    });

    totalOrders = orders.length;

    orders.forEach((o) => {
      const orderTotal = Number(o.total) || 0;
      if (o.paymentStatus === "PAID") {
        paidOrders += 1;
        if (o.status !== "CANCELLED") {
          totalRevenue += orderTotal;
        }
      }

      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status] += 1;
      } else {
        statusCounts[o.status] = 1;
      }
    });

    if (paidOrders > 0) {
      averageOrderValue = Math.round(totalRevenue / paidOrders);
    }

    recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total) || 0,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      customerName: o.user?.name || "Guest Customer",
    }));
  } catch (err) {
    console.error("Order analytics query error:", err);
  }

  return {
    totalProducts,
    totalVariants,
    inStockVariants,
    lowStockVariants,
    outOfStockVariants,
    totalCategories,
    categoriesWithCount,
    totalOrders,
    paidOrders,
    totalRevenue,
    averageOrderValue,
    statusCounts,
    recentOrders,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const totalStatusOrders = Math.max(data.totalOrders, 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Store Analytics & Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time sales statistics, stock distribution, and operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#A0463E] rounded-lg shadow hover:bg-[#883a33] transition-colors"
          >
            <ShoppingCart size={16} />
            Manage Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString("en-IN")}`}
          subtitle={`From ${data.paidOrders} paid orders`}
          icon={IndianRupee}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${data.averageOrderValue.toLocaleString("en-IN")}`}
          subtitle="Per completed purchase"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders}
          subtitle={`${data.paidOrders} marked as paid`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Catalog & Stock"
          value={data.totalProducts}
          subtitle={`${data.totalVariants} variants across ${data.totalCategories} categories`}
          icon={Package}
        />
      </div>

      {/* Analytics Grid: Inventory & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Stock Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Inventory Stock Health
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Variant stock status distribution
              </p>
            </div>
            <Link
              href="/admin/attributes"
              className="text-xs font-semibold text-[#A0463E] hover:underline flex items-center gap-1"
            >
              View Stock <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {/* In Stock */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  In Stock (&gt; 5 units)
                </span>
                <span className="text-gray-900 font-semibold">
                  {data.inStockVariants} variants
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (data.inStockVariants / Math.max(data.totalVariants, 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Low Stock */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Low Stock (1-5 units)
                </span>
                <span className="text-gray-900 font-semibold">
                  {data.lowStockVariants} variants
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (data.lowStockVariants /
                        Math.max(data.totalVariants, 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Out of Stock */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <XCircle size={14} className="text-rose-500" />
                  Out of Stock (0 units)
                </span>
                <span className="text-gray-900 font-semibold">
                  {data.outOfStockVariants} variants
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (data.outOfStockVariants /
                        Math.max(data.totalVariants, 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
              <p className="text-[11px] text-emerald-700 font-medium">In Stock</p>
              <p className="text-lg font-bold text-emerald-800">{data.inStockVariants}</p>
            </div>
            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
              <p className="text-[11px] text-amber-700 font-medium">Low Stock</p>
              <p className="text-lg font-bold text-amber-800">{data.lowStockVariants}</p>
            </div>
            <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
              <p className="text-[11px] text-rose-700 font-medium">Out of Stock</p>
              <p className="text-lg font-bold text-rose-800">{data.outOfStockVariants}</p>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Fulfillment & Order Status
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Breakdown of orders by fulfillment lifecycle
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
              {data.totalOrders} total
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              {
                label: "Delivered",
                key: "DELIVERED",
                icon: CheckCircle2,
                color: "bg-emerald-500",
                textColor: "text-emerald-700",
              },
              {
                label: "Shipped / In Transit",
                key: "SHIPPED",
                icon: Truck,
                color: "bg-blue-500",
                textColor: "text-blue-700",
              },
              {
                label: "Processing",
                key: "PROCESSING",
                icon: Clock,
                color: "bg-amber-500",
                textColor: "text-amber-700",
              },
              {
                label: "Confirmed / Pending",
                key: "CONFIRMED",
                icon: Clock,
                color: "bg-indigo-500",
                textColor: "text-indigo-700",
              },
              {
                label: "Cancelled",
                key: "CANCELLED",
                icon: XCircle,
                color: "bg-gray-400",
                textColor: "text-gray-600",
              },
            ].map((item) => {
              const count =
                (data.statusCounts[item.key] || 0) +
                (item.key === "CONFIRMED" ? data.statusCounts["PENDING"] || 0 : 0);
              const percentage = Math.round((count / totalStatusOrders) * 100);
              const Icon = item.icon;

              return (
                <div key={item.key}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      <Icon size={14} className={item.textColor} />
                      {item.label}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Categories & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FolderOpen size={18} className="text-[#A0463E]" />
              Top Categories
            </h2>
            <Link
              href="/admin/categories"
              className="text-xs font-semibold text-[#A0463E] hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {data.categoriesWithCount.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No categories created yet.</p>
            ) : (
              data.categoriesWithCount.map((cat) => (
                <div
                  key={cat.id}
                  className="py-3 flex items-center justify-between text-xs hover:bg-gray-50/50 px-1 rounded transition-colors"
                >
                  <span className="font-medium text-gray-800">{cat.name}</span>
                  <span className="font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {cat._count.products} products
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Recent Orders
              </h2>
              <p className="text-xs text-gray-500">Latest transactions on store</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#A0463E] hover:underline"
            >
              View all orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 text-gray-600">{order.customerName}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.paymentStatus} ({order.status})
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
