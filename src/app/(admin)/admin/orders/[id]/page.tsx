
import { notFound } from "next/navigation";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import OrderStatusUpdater from "./OrderStatusUpdater";

export const metadata = {
  title: "Order Details | Admin - LV's Trendz",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      address: true,
      items: {
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Package size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.sku && (
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    )}
                    {item.attributes && (() => {
                      const attrs = item.attributes as any;
                      const size = attrs.size;
                      const color = attrs.color;
                      const measurements = attrs.customMeasurements;
                      
                      const labelParts = [];
                      if (size) labelParts.push(`Size: ${size}`);
                      if (color) labelParts.push(`Color: ${color}`);
                      
                      return (
                        <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                          {labelParts.length > 0 && <p>{labelParts.join(" • ")}</p>}
                          {measurements && (
                            <div className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-150 border-dashed mt-1 max-w-md">
                              <span className="font-semibold text-gray-750 block text-[9px] uppercase tracking-wider mb-0.5">Custom Measurements:</span>
                              Bust: {measurements.bust}&quot; | Waist: {measurements.waist}&quot; | Hip: {measurements.hip}&quot; | Shoulder: {measurements.shoulder}&quot;
                              {measurements.notes && (
                                <span className="block italic text-gray-400 mt-0.5">Note: &ldquo;{measurements.notes}&rdquo;</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ₹{Number(item.price).toLocaleString("en-IN")} × {item.quantity}
                    </p>
                    <p className="font-medium text-gray-900">
                      ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  ₹{Number(order.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span className="text-green-600">
                    -₹{Number(order.discount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">
                  {Number(order.shipping) === 0
                    ? "Free"
                    : `₹${Number(order.shipping).toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-[#A0463E]">
                  ₹{Number(order.total).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer, Address, Status Update */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-900 font-medium">
                {order.user.name || "Guest"}
              </p>
              {order.user.email && (
                <p className="text-gray-600">{order.user.email}</p>
              )}
              {order.user.phone && (
                <p className="text-gray-600">{order.user.phone}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.address.name}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} -{" "}
                {order.address.pincode}
              </p>
              <p>{order.address.country}</p>
              <p className="pt-1">📞 {order.address.phone}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Payment</h3>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="text-gray-900">
                  {order.paymentMethod || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-gray-900 text-xs font-mono">
                    {order.paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Updater */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
          />
        </div>
      </div>
    </div>
  );
}

