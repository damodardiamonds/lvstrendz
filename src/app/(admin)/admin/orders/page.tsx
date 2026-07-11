
import { db } from "@/lib/db";
import { ShoppingCart } from "lucide-react";
import OrderTable from "./components/OrderTable";

export const metadata = {
  title: "Orders | Admin - LV's Trendz",
};

interface OrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { status } = await searchParams;

  const where = status && status !== "ALL" ? { status: status as never } : {};

  const orders = await db.order.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get counts for filter tabs
  const counts = await db.order.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusCounts: Record<string, number> = { ALL: 0 };
  counts.forEach((c) => {
    statusCounts[c.status] = c._count;
    statusCounts.ALL += c._count;
  });

  const statuses = [
    "ALL",
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track customer orders
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => {
          const isActive = (status || "ALL") === s;
          const count = statusCounts[s] || 0;
          return (
            <a
              key={s}
              href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#A0463E] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#A0463E] hover:text-[#A0463E]"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()} ({count})
            </a>
          );
        })}
      </div>

      {/* Orders Table */}
      {orders.length > 0 ? (
        <OrderTable orders={orders} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Orders will appear here once customers start purchasing.
          </p>
        </div>
      )}
    </div>
  );
}

