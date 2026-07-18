
// src/app/(shop)/help-center/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Help Center — LV\'s Trendz',
  description: 'Welcome to the LV\'s Trendz Help Center. Find answers to orders, shipping, sizing, and payment details.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Customer Support
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Help Center
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24">
        <div className="space-y-12">
          <div className="border-b border-gray-100 pb-6">
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
              Welcome to the <span className="text-[#A0463E] font-bold">LV’s Trendz</span> Help Center. We are dedicated to providing you with the best shopping experience for your favorite ethnic wear. Find quick answers to your questions below.
            </p>
          </div>

          <div className="space-y-10 text-gray-600 leading-relaxed text-sm md:text-base font-medium">
            {/* Orders & Purchasing */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>🛍️</span> Orders & Purchasing
              </h2>
              <div className="space-y-3">
                <h3 className="font-extrabold text-gray-800">How do I place an order?</h3>
                <p>
                  Simply browse our collections, select your desired outfit (make sure to check the size guide!), and click <span className="font-bold text-black">Add to Cart</span>. Once you are ready, click on your cart and proceed to <span className="font-bold text-black">Checkout</span> to enter your shipping and payment details.
                </p>
                <h3 className="font-extrabold text-gray-800 pt-2">Can I change or cancel my order after placing it?</h3>
                <p>
                  We process orders quickly to ensure fast delivery. If you need to make changes or cancel an order, please contact our support team at <span className="text-[#A0463E] font-bold hover:underline">lvstrendz.info@gmail.com</span> within <span className="font-bold text-black">2 hours</span> of placing your order.
                </p>
              </div>
            </div>

            {/* Shipping & Delivery */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>🚚</span> Shipping & Delivery
              </h2>
              <div className="space-y-3">
                <h3 className="font-extrabold text-gray-800">Do you ship internationally?</h3>
                <p>
                  Yes, we offer free standard shipping on all orders worldwide.
                </p>
                <h3 className="font-extrabold text-gray-800 pt-2">How long will it take to receive my order?</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>
                    <span className="font-bold text-black">Standard Ready-to-Wear Delivery:</span> 5 to 7 business days.
                  </li>
                  <li>
                    <span className="font-bold text-black">Custom Size Orders:</span> Requires an <span className="font-bold text-[#A0463E]">additional 5 to 8 business days</span> for custom tailoring and processing before dispatch.
                  </li>
                </ul>
                <p className="text-xs text-gray-500 italic pt-1">
                  Tracking details will be emailed to you as soon as your outfit is ready and shipped.
                </p>
              </div>
            </div>

            {/* Exchange Policy */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>🔄</span> Exchange Policy
              </h2>
              <div className="space-y-3">
                <div className="bg-red-50/50 border border-[#A0463E]/20 p-5 rounded-xl text-gray-700 text-sm">
                  <span className="font-bold text-[#A0463E] uppercase tracking-wider block mb-1">Important Note</span>
                  We do <span className="font-bold text-[#A0463E]">not</span> accept returns or offer refunds. All sales are final. We do not offer exchanges on custom-size orders.
                </div>
                <p>
                  However, we happily offer <span className="font-bold text-black">exchanges only</span> under the following strict conditions:
                </p>
                <ol className="space-y-2 pl-4 list-decimal">
                  <li>
                    <span className="font-bold text-black">Wrong Size:</span> If the outfit does not fit you properly.
                  </li>
                  <li>
                    <span className="font-bold text-black">Defective/Damaged Piece:</span> If the item arrived damaged or with a manufacturing defect.
                  </li>
                </ol>
                <h3 className="font-extrabold text-gray-800 pt-2">What are the conditions for an exchange?</h3>
                <p>
                  To be eligible for an exchange, your item must be requested within <span className="font-bold text-black">7 days</span> of delivery. The item must be unworn, unwashed, with all original tags attached, and in its original packaging. Custom-stitched or custom-sized outfits are entirely excluded from exchanges.
                </p>
                <h3 className="font-extrabold text-gray-800 pt-2">How do I initiate an exchange?</h3>
                <p>
                  Please email us at <span className="text-[#A0463E] font-bold hover:underline">lvstrendz.info@gmail.com</span> with your <span className="font-bold text-black">Order ID</span> and clear photos/videos of the defect or size issue. Our customer care team will review your request and guide you through the exchange process.
                </p>
              </div>
            </div>

            {/* Sizing & Customization */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>📏</span> Sizing & Customization
              </h2>
              <div className="space-y-3">
                <h3 className="font-extrabold text-gray-800">How do I choose the correct size?</h3>
                <p>
                  Every product page includes a detailed size chart. Since ethnic wear like Lehenga Cholis depends heavily on a good fit, we highly recommend measuring your bust, waist, and hips accurately before ordering to avoid size exchange hassle.
                </p>
                <h3 className="font-extrabold text-gray-800 pt-2">Do you offer custom stitching?</h3>
                <p>
                  Yes! Select outfits come with custom sizing options. Please note that choosing a custom size adds <span className="font-bold text-black">5 to 8 days</span> to our standard processing time so our tailors can ensure a flawless fit. For specific measurement requests, reach out to our team via WhatsApp/Call at <a href="tel:+918780389067" className="text-[#A0463E] font-bold hover:underline">+91-8780389067</a>.
                </p>
              </div>
            </div>

            {/* Payments & Security */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <span>💳</span> Payments & Security
              </h2>
              <div className="space-y-3">
                <h3 className="font-extrabold text-gray-800">What payment methods do you accept?</h3>
                <p>We accept a wide range of secure payment options, including:</p>
                <ul className="space-y-1.5 pl-4 list-disc">
                  <li>Credit / Debit Cards (Visa, MasterCard, RuPay)</li>
                  <li>UPI (Google Pay, PhonePe, Paytm)</li>
                  <li>Net Banking</li>
                </ul>
                <h3 className="font-extrabold text-gray-800 pt-2">Is my payment secure?</h3>
                <p>
                  Absolutely. Your online transactions are completely secure. We use industry-standard encryption protocols to protect your financial data and personal information.
                </p>
              </div>
            </div>

            {/* Still Need Help? */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2 pb-2">
                <span>📞</span> Still Need Help?
              </h2>
              <p>
                If you couldn't find the answer to your question, our customer care team is always happy to assist you!
              </p>
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl space-y-3 text-sm">
                <p>
                  📧 <span className="font-bold text-black">Email Us:</span> <a href="mailto:lvstrendz.info@gmail.com" className="text-[#A0463E] font-bold hover:underline">lvstrendz.info@gmail.com</a>
                </p>
                <p>
                  📞 <span className="font-bold text-black">Call / WhatsApp:</span> <a href="tel:+918780389067" className="text-[#A0463E] font-bold hover:underline">+91-8780389067</a>
                </p>
                <p>
                  📍 <span className="font-bold text-black">Visit Us:</span> C-301 Bhavani Complex, Nr. Gajera Circle, Opp. Saibaba Petrol Pump, Katargam, Surat - 395004
                </p>
                <p>
                  ⏰ <span className="font-bold text-black">Support Hours:</span> Monday to Saturday, 10:00 AM – 7:00 PM (IST)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

