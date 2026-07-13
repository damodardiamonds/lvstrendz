// src/app/(shop)/privacy-policy/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — LV\'s Trendz',
  description: 'Learn more about how we collect, use, and protect your personal information at LV\'s Trendz.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Data Protection
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Privacy Policy
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-[1000px] mx-auto px-4 py-16 md:py-24 text-gray-600 leading-relaxed text-sm md:text-base font-medium space-y-10">
        <div className="border-b border-gray-100 pb-6">
          <p>
            Welcome to <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link>. Your privacy is important to us, and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit or make a purchase from our website.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            1. Information We Collect
          </h2>
          <p>When you use our website, we may collect the following information:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Shipping and billing address</li>
            <li>Payment details (processed securely through third-party payment gateways)</li>
            <li>Order history</li>
            <li>Device and browser information</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            2. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Process and deliver your orders</li>
            <li>Provide customer support</li>
            <li>Send order updates and tracking details</li>
            <li>Improve our products, website features, and customer services</li>
            <li>Communicate promotional offers and new collections (only if subscribed to newsletters)</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            3. Payment Security
          </h2>
          <p>
            All payments made on <Link href="/" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz</Link> are processed through secure and trusted payment gateways. We do not store your complete payment or credit card details on our servers.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            4. Sharing of Information
          </h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. Your information may only be shared with trusted service providers such as shipping partners and payment processors for order fulfillment purposes.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            5. Cookies & Tracking
          </h2>
          <p>
            Our website may use cookies and similar technologies to improve your browsing experience, analyze website traffic, and personalize content. You can choose to disable cookies through your browser settings.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            6. Data Protection
          </h2>
          <p>
            We take reasonable physical, technical, and administrative security measures to protect your personal information from unauthorized access, misuse, alteration, or disclosure.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            7. Your Rights
          </h2>
          <p>You may request to:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            <li>Access your personal data</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Delete your information (subject to legal, auditing, or order-related obligations)</li>
          </ul>
          <p className="pt-2">For any privacy-related requests, please contact us through our website support channels.</p>
        </div>

        {/* Section 8 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            8. Third-Party Links
          </h2>
          <p>
            Our website may contain links to external websites or social media platforms. We are not responsible for the privacy practices or contents of those third-party websites.
          </p>
        </div>

        {/* Section 9 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            9. Policy Updates
          </h2>
          <p>
            LV’s Trendz reserves the right to update or modify this Privacy Policy at any time without prior notice. Changes will be effective immediately upon posting on this page.
          </p>
        </div>

        {/* Section 10 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
            10. Contact Us
          </h2>
          <p>
            If you have any questions regarding this Privacy Policy, please contact us through <Link href="/contact-us" className="text-[#A0463E] font-bold hover:underline">LV’s Trendz Support Page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
