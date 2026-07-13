
// src/app/(shop)/contact-us/ContactForm.tsx
'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.', {
        style: { background: '#3D1515', color: '#fff' }
      });
      return;
    }

    setLoading(true);

    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      toast.success('Your message has been sent successfully!', {
        style: { background: '#3D1515', color: '#fff' }
      });
      setFormData({ name: '', phone: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-gray-50 border border-gray-100 p-8 md:p-10 rounded-2xl">
      <span className="text-xs uppercase tracking-[0.25em] text-[#A0463E] font-bold mb-3 block">
        Inquiry
      </span>
      <h2 className="text-2xl lg:text-3xl font-extrabold text-black uppercase tracking-wide mb-8">
        Send A Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="flex flex-col">
            <label className="text-xs uppercase font-bold text-gray-700 tracking-wider mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A0463E] focus:ring-1 focus:ring-[#A0463E] transition-all"
              required
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="text-xs uppercase font-bold text-gray-700 tracking-wider mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A0463E] focus:ring-1 focus:ring-[#A0463E] transition-all"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="text-xs uppercase font-bold text-gray-700 tracking-wider mb-2">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A0463E] focus:ring-1 focus:ring-[#A0463E] transition-all"
            required
          />
        </div>

        {/* Message */}
        <div className="flex flex-col">
          <label className="text-xs uppercase font-bold text-gray-700 tracking-wider mb-2">Message *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your message details"
            rows={6}
            className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A0463E] focus:ring-1 focus:ring-[#A0463E] transition-all resize-none"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A0463E] hover:bg-black disabled:bg-gray-400 text-white font-bold uppercase tracking-widest text-xs py-4 px-6 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={14} />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
