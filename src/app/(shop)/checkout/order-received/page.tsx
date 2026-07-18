import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import RetryPayment from "./RetryPayment";

import { CheckCircle, AlertCircle, Calendar, CreditCard, Mail, Phone, MapPin, ShoppingBag } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    orderNumber?: string;
    pending_verification?: string;
  }>;
}

export const revalidate = 0; // Don't cache receipt page

export default async function OrderReceivedPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { orderNumber, pending_verification } = resolvedParams;

  if (!orderNumber) {
    redirect("/shop");
  }

  // Fetch the order from the database
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      user: true,
    },
  });

  if (!order) {
    redirect("/shop");
  }

  // Address helper casting from JSON
  const address = order.shippingAddress as any;

  // Simple formatting helper fallback (INR ₹ is the brand default)
  const format = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const isPaid = order.paymentStatus === "PAID";
  const isSandbox = pending_verification === "true";
  const showSuccess = isPaid || isSandbox;

  return (
    <main className="bg-white min-h-screen py-16 px-4">
      {/* Clear cart on success */}
      {showSuccess && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem("lvstrendz_cart");
                localStorage.removeItem("lvstrendz_coupon");
                window.dispatchEvent(new Event("cartUpdated"));
              } catch(e) {
                console.error("Failed to clear cart:", e);
              }
            `
          }}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Banner */}
        {showSuccess ? (
          <div className="text-center space-y-3.5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
              {isSandbox ? "Order Registered" : "Thank you!"}
            </h1>
            <p className="text-gray-500 font-semibold text-sm max-w-md mx-auto">
              {isSandbox ? (
                <>Your order is pending manual verification. We will send updates to <span className="text-black font-extrabold">{order.user.email}</span>.</>
              ) : (
                <>Your order has been successfully received. We've sent a confirmation email to <span className="text-black font-extrabold">{order.user.email}</span>.</>
              )}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3.5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertCircle size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
              Payment Required
            </h1>
            <p className="text-gray-500 font-semibold text-sm max-w-md mx-auto">
              Your order has been registered, but payment was not completed or failed. Please click the button below to pay now and complete your order.
            </p>
          </div>
        )}

        {/* Quick Order Info Grid */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-3xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Order Number
            </span>
            <span className="block text-xs font-black text-black select-all">
              {order.orderNumber}
            </span>
          </div>
          <div className="space-y-1 border-l border-gray-200 max-md:border-none">
            <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Date
            </span>
            <span className="block text-xs font-black text-black">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="space-y-1 border-l border-gray-200">
            <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Total Amount
            </span>
            <span className="block text-xs font-black text-[#A0463E]">
              {format(Number(order.total))}
            </span>
          </div>
          <div className="space-y-1 border-l border-gray-200">
            <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Payment Status
            </span>
            <span className="block text-xs font-black text-black uppercase">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-black flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#A0463E]" />
              <span>Order Details</span>
            </h2>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-100">
              {order.status}
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Items table */}
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const attrs = item.attributes as any;
                return (
                  <div key={item.id} className="py-4 flex justify-between gap-4 text-sm font-semibold">
                    <div className="text-gray-700">
                      <span className="text-black font-extrabold">{item.name}</span>
                      <span className="text-gray-400 font-bold ml-1.5">× {item.quantity}</span>
                      {attrs && (attrs.size || attrs.color) ? (
                        <span className="block text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                          {attrs.size ? `Size: ${attrs.size}` : ""}
                          {attrs.size && attrs.color ? " | " : ""}
                          {attrs.color ? `Color: ${attrs.color}` : ""}
                        </span>
                      ) : null}
                      {attrs && attrs.customMeasurements && (
                        <span className="block text-[9px] text-gray-500 font-semibold normal-case mt-0.5 border-l border-gray-350 pl-2">
                          Bust: {attrs.customMeasurements.bust}&quot; | Waist: {attrs.customMeasurements.waist}&quot; | Hip: {attrs.customMeasurements.hip}&quot; | Shoulder: {attrs.customMeasurements.shoulder}&quot;
                          {attrs.customMeasurements.notes && (
                            <span className="block italic text-gray-400 text-[8.5px] mt-0.5">Note: &ldquo;{attrs.customMeasurements.notes}&rdquo;</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-black font-extrabold shrink-0">
                      {format(Number(item.price) * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations pricing breakdown */}
            <div className="border-t border-gray-100 pt-5 space-y-3.5 text-xs font-semibold text-gray-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="text-black font-extrabold">{format(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{format(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="text-black font-extrabold">
                  {Number(order.shipping) === 0 ? "Free Shipping" : format(Number(order.shipping))}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-black border-t border-gray-100 pt-4.5">
                <span>{showSuccess ? "Total Amount Paid" : "Total Amount Due"}</span>
                <span className="text-lg text-[#A0463E] font-black">{format(Number(order.total))}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Address and Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Customer contact card */}
          <div className="border border-gray-150 rounded-2xl p-6 bg-white shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-gray-100 pb-2.5 flex items-center gap-2">
              <Mail size={14} className="text-[#A0463E]" />
              <span>Contact Details</span>
            </h3>
            <div className="space-y-2.5 text-xs font-semibold text-gray-600">
              <div className="flex justify-between">
                <span>Customer Email:</span>
                <span className="text-black font-extrabold">{order.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone Number:</span>
                <span className="text-black font-extrabold">{address?.phone || order.user.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Shipping address card */}
          {address && (
            <div className="border border-gray-150 rounded-2xl p-6 bg-white shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <MapPin size={14} className="text-[#A0463E]" />
                <span>Delivery Address</span>
              </h3>
              <div className="text-xs font-semibold text-gray-600 leading-relaxed">
                <span className="block text-black font-extrabold mb-1">{address.name}</span>
                <span className="block">{address.line1}</span>
                {address.line2 && <span className="block">{address.line2}</span>}
                <span className="block">
                  {address.city}, {address.state} — {address.pincode}
                </span>
                <span className="block text-black/70 font-extrabold mt-1">{address.country}</span>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="text-center pt-4 max-w-sm mx-auto space-y-3">
          {!showSuccess && <RetryPayment orderId={order.id} />}
          <Link
            href="/shop"
            className="w-full text-center block border border-[#A0463E] hover:bg-[#A0463E]/5 text-[#A0463E] text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-lg transition-all duration-300 shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </main>
  );
}
