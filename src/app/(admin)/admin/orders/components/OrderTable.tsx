
import Link from "next/link";
import { Eye } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "./StatusBadge";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: unknown;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  _count: {
    items: number;
  };
}

export default function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Order
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Customer
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Items
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Total
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Payment
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Date
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    #{order.orderNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-gray-900">
                      {order.user.name || "Guest"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.user.email || order.user.phone}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {order._count.items}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  ₹{Number(order.total).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#A0463E] hover:bg-[#A0463E]/10 rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

