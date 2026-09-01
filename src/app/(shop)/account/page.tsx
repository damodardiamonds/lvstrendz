"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Phone, Mail, LogOut, ShoppingBag, ShieldCheck } from "lucide-react";

interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/login";
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A0463E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#A0463E]/10 text-[#A0463E] flex items-center justify-center mx-auto">
            <User size={30} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
          <p className="text-sm text-gray-500">
            Sign in to access your profile, order history, and account settings.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#A0463E] text-white font-semibold hover:bg-[#8B3B34] transition-colors"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/login?redirect=/admin"
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Log in to Admin Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-[#A0463E]/10 text-[#A0463E] flex items-center justify-center text-2xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={30} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.name || (user.phone ? `+91 ${user.phone}` : "Customer")}!
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={16} className="text-green-600" />
                Verified Account ({user.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A0463E] text-white font-semibold hover:bg-[#8B3B34] transition-colors shadow-sm text-sm"
              >
                Admin Panel →
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-[#A0463E]" />
              Account Details
            </h2>
            <div className="space-y-4">
              {user.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Mobile Number</p>
                    <p className="text-sm font-semibold text-gray-900">+91 {user.phone}</p>
                  </div>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#A0463E]" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#A0463E]/30 bg-[#A0463E]/5 hover:bg-[#A0463E]/10 transition-all text-[#A0463E] font-semibold text-sm"
                >
                  <span>Go to Admin Dashboard</span>
                  <span>→</span>
                </Link>
              )}
              <Link
                href="/cart"
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all text-gray-800 font-medium text-sm"
              >
                <span>View Shopping Cart</span>
                <span className="text-[#A0463E] font-semibold">→</span>
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[#A0463E] hover:bg-[#A0463E]/5 transition-all text-gray-800 font-medium text-sm"
              >
                <span>Browse Products & Shop</span>
                <span className="text-[#A0463E] font-semibold">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
