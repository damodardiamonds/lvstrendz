
// src/app/(shop)/terms-conditions/page.tsx
import React from 'react';

export const metadata = {
  title: 'Terms & Conditions — LV\'s Trendz',
  description: 'Read the Terms and Conditions governing use of the LV\'s Trendz website and purchases.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Legal Agreements
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Terms & Conditions
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24 text-gray-600 leading-relaxed text-sm md:text-base font-medium space-y-10">
        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            1. Introduction
          </h2>
          <p>
            Welcome to <span className="font-bold text-black">LV’s Trendz</span> (accessible via <code className="bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-xs">lvstrendz.com</code>). These Terms and Conditions govern your use of our website and the purchase of any products from our online store. By accessing our site and making a purchase, you agree to be bound by these terms. If you do not agree with any part of these terms, please do not use our website.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            2. Business Information
          </h2>
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl space-y-3">
            <p>
              💼 <span className="font-bold text-black">Trade Name:</span> LV’s Trendz
            </p>
            <p>
              👤 <span className="font-bold text-black">Legal Proprietor Name:</span> Kikani Krishna Divyesh
            </p>
            <p>
              🆔 <span className="font-bold text-black">GST Number:</span> 24DDLPM9492K1ZQ
            </p>
            <p>
              📍 <span className="font-bold text-black">Registered Address:</span> C-301 Bhavani Complex, Nr. Gajera Circle, Opp. Saibaba Petrol Pump, Katargam, Surat - 395004
            </p>
            <p>
              📧 <span className="font-bold text-black">Contact Email:</span> <a href="mailto:lvstrendz.info@gmail.com" className="text-[#A0463E] hover:underline font-bold">lvstrendz.info@gmail.com</a>
            </p>
            <p>
              📞 <span className="font-bold text-black">Contact Number:</span> <a href="tel:+918780389067" className="text-[#A0463E] hover:underline font-bold">+91-8780389067</a>
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            3. Products and Pricing
          </h2>
          <ul className="space-y-3 pl-4 list-disc">
            <li>
              <span className="font-bold text-black">Accuracy:</span> We strive to display the colors, embroidery details, and designs of our products (such as our Lehenga Cholis and Dupatta sets) as accurately as possible. However, slight variations may occur due to screen settings and photographic lighting.
            </li>
            <li>
              <span className="font-bold text-black">Pricing:</span> All prices listed on our website are in Indian Rupees (INR) unless stated otherwise. We reserve the right to change prices and modify or discontinue products at any time without prior notice.
            </li>
            <li>
              <span className="font-bold text-black">Errors:</span> In the event that a product is listed at an incorrect price due to a typographical error, we reserve the right to refuse or cancel any orders placed for that product.
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            4. Orders and Payments
          </h2>
          <ul className="space-y-3 pl-4 list-disc">
            <li>
              <span className="font-bold text-black">Acceptance:</span> Receiving an order confirmation email does not signify our acceptance of your order. We reserve the right to accept, decline, or limit your order for any reason.
            </li>
            <li>
              <span className="font-bold text-black">Payment Security:</span> We use secure, authorized payment gateways to process your transactions. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            5. Shipping and Delivery
          </h2>
          <ul className="space-y-3 pl-4 list-disc">
            <li>We ship orders from our hub in Surat to destinations worldwide.</li>
            <li>We offer free standard shipping on all orders worldwide. Shipping timelines will be calculated and displayed at checkout. While we make every effort to deliver goods within the estimated timelines, LV’s Trendz is not responsible for delays caused by third-party courier services or customs processing.</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            6. Intellectual Property
          </h2>
          <p>
            All content included on this website — including text, graphics, logos, product images, digital downloads, and site design — is the exclusive property of <span className="font-bold text-black">LV’s Trendz</span> and is protected by applicable copyright and intellectual property laws. You may not reproduce, duplicate, copy, or exploit any portion of this site without express written permission from us.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            7. Limitation of Liability
          </h2>
          <p>
            LV’s Trendz, its directors, or employees shall not be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of, or inability to use, our website or products.
          </p>
        </div>

        {/* Section 8 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            8. Governing Law
          </h2>
          <p>
            These Terms and Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India, under the jurisdiction of the courts in <span className="font-bold text-black">Surat, Gujarat</span>.
          </p>
        </div>

        {/* Section 9 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            9. Changes to Terms & Conditions
          </h2>
          <p>
            We reserve the right to update, change, or replace any part of these Terms and Conditions by posting updates to our website. It is your responsibility to check this page periodically for changes.
          </p>
        </div>
      </section>
    </main>
  );
}

