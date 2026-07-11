
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const [mode, setMode] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP login state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setOtpSent(true);
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your LV&apos;s Trendz account</p>
      </div>

      {/* Toggle between Email and OTP */}
      <div className="flex border border-gray-200 rounded-lg mb-6 overflow-hidden">
        <button
          onClick={() => { setMode("email"); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === "email"
              ? "bg-[#A0463E] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Email Login
        </button>
        <button
          onClick={() => { setMode("otp"); setError(""); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === "otp"
              ? "bg-[#A0463E] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Mobile OTP
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Email Login Form */}
      {mode === "email" && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#A0463E] text-white font-medium rounded-lg hover:bg-[#8a3b34] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      )}

      {/* OTP Login Form */}
      {mode === "otp" && !otpSent && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                required
                maxLength={10}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full py-2.5 bg-[#A0463E] text-white font-medium rounded-lg hover:bg-[#8a3b34] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* OTP Verification Form */}
      {mode === "otp" && otpSent && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            OTP sent to <span className="font-medium">+91 {phone}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              required
              maxLength={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition text-center text-lg tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-2.5 bg-[#A0463E] text-white font-medium rounded-lg hover:bg-[#8a3b34] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtp(""); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Change number
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#A0463E] font-medium hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4" />
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-8" />
        <div className="h-10 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

