// src/app/(shop)/refund_exchange/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Refund and Exchange Policy — LV\'s Trendz',
  description: 'Read our Returns and Exchange policy. Learn about conditions for size mismatch or defective products.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Customer Guarantee
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Refund & Exchange
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24 text-gray-600 leading-relaxed text-sm md:text-base font-medium space-y-10">
        <div className="border-b border-gray-100 pb-6">
          <p>
            Thank you for shopping with <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link>. We strive to provide high-quality products and a smooth shopping experience for all our customers. Please read our Returns & Exchange Policy carefully before making a purchase.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            Exchange Policy
          </h2>
          <p>We offer exchanges only in the following cases:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Size mismatch or fitting issues</li>
            <li>Damaged or defective product received</li>
          </ul>
          <p className="pt-2">To request an exchange, customers must contact us within <span className="font-bold text-black">48 hours</span> of receiving the order with:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Order number</li>
            <li>Clear product images or video demonstrating the issue</li>
            <li>Reason for exchange request</li>
          </ul>
          <p className="pt-2 font-semibold text-black">Exchanged products must be:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Unused, unworn, and unwashed</li>
            <li>In original condition with all product parts present</li>
            <li>With all tags and packaging fully intact</li>
          </ul>
          <p className="pt-2">Once approved, our team will guide you through the process of returning the package to our hub.</p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            No Return Policy
          </h2>
          <div className="bg-red-50/50 border border-[#A0463E]/20 p-5 rounded-xl text-gray-700 text-sm">
            <span className="font-bold text-[#A0463E] uppercase tracking-wider block mb-1">Final Sale</span>
            We do <span className="font-bold text-[#A0463E]">not</span> offer returns, order cancellations, or cash refunds once an order has been successfully placed or delivered.
          </div>
          <p>
            Please review the product details, size chart guidelines, and order specifications carefully before finalizing your payment.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            Non-Exchangeable Items
          </h2>
          <p>The following items are completely excluded and not eligible for exchanges under any circumstances:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Products returned without original tags, invoices, or packaging</li>
            <li>Worn, washed, stained, or damaged garments caused after delivery</li>
            <li>Customized, altered, or custom-stitched products</li>
            <li>Items purchased during clearance sales, discount programs, or promotions</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            Exchange Approval
          </h2>
          <p>
            All exchange requests are subject to strict visual inspection and final approval by the LV’s Trendz quality control team. We reserve the right to reject exchange packages that do not meet our criteria.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            Shipping Charges
          </h2>
          <p>
            Customers are responsible for covering the return shipping charges for exchanges, unless the product received is proven to be damaged, defective, or incorrect due to our error.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            Contact Us
          </h2>
          <p>
            For exchange-related support or questions, please contact our customer care team through the <Link href="/contact-us" className="text-[#A0463E] font-bold hover:underline">Contact Support Page</Link> with your purchase details.
          </p>
        </div>
      </section>
    </main>
  );
}
