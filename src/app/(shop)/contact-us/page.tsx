
// src/app/(shop)/contact-us/page.tsx
import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldAlert } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import ContactForm from './ContactForm';

export const metadata = {
  title: 'Contact Us — LV\'s Trendz',
  description: 'Have questions? Get in touch with the LV\'s Trendz team. Visit our store in Surat, Katargam or email us.',
};

export default function Page() {
  return (
    <main className="bg-white min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Hero Header */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#A0463E] font-bold">
            Get in touch
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide mt-2">
            Contact Us
          </h1>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Info Side (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-10">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-3 block">
                Information
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-black uppercase tracking-wide mb-8">
                Store Location & Contacts
              </h2>

              <div className="space-y-8">
                {/* Location */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#A0463E] border border-gray-100 flex-shrink-0">
                    <MapPin size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-1">Our Store</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      C-301 Bhavani Complex, Near Gajera Circle,<br />
                      Opp. Saibaba Petrol Pump, Katargam,<br />
                      Surat, Gujarat, India - 395004
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#A0463E] border border-gray-100 flex-shrink-0">
                    <Phone size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-1">Call Us</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      Mobile: <a href="tel:+918780389067" className="hover:text-[#A0463E] transition-colors">+91-8780389067</a>
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#A0463E] border border-gray-100 flex-shrink-0">
                    <Mail size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-1">Email Address</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      📧 <a href="mailto:lvstrendz.info@gmail.com" className="hover:text-[#A0463E] transition-colors">lvstrendz.info@gmail.com</a>
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#A0463E] border border-gray-100 flex-shrink-0">
                    <Clock size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black uppercase text-sm tracking-wider mb-1">Open Hours</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                      Monday – Sunday: 8:00 am – 10:00 pm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex items-start gap-3">
              <ShieldAlert className="text-[#A0463E] mt-0.5 flex-shrink-0" size={20} />
              <p className="text-xs text-gray-500 leading-relaxed">
                We respect your privacy. All details provided in the contact form will remain strictly confidential and will only be used to answer your query.
              </p>
            </div>
          </div>

          {/* Form Side (7 Columns) */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

        </div>
      </section>

      {/* Map Section */}
      <section className="w-full h-[450px] bg-gray-50 border-t border-gray-100 relative">
        <iframe
          loading="lazy"
          src="https://maps.google.com/maps?q=Bhavani%20Complex%2C%20Mahavir%20Nagar%20Society%2C%20Vishal%20Nagar%2C%20Surat%2C%20Gujarat%20395004&t=m&z=14&output=embed&iwloc=near"
          title="LV's Trendz Store Location Map"
          className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-500"
          aria-label="Map location of store"
        />
      </section>
    </main>
  );
}
