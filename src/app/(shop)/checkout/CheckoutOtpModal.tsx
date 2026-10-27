"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "@firebase/auth";
import {
  ShieldCheck,
  Smartphone,
  Lock,
  X,
  RotateCcw,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    __checkoutConfirmationResult?: ConfirmationResult;
  }
}

interface CheckoutOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerified: (verificationToken: string) => void;
  isCod: boolean;
  formattedAmount: string;
}

export default function CheckoutOtpModal({
  isOpen,
  onClose,
  phone,
  onVerified,
  isCod,
  formattedAmount,
}: CheckoutOtpModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(45);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const verifiedTokenRef = useRef<string | null>(null);
  const hasTriggeredInitialSend = useRef(false);
  const isSendingRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const cleanedPhone = phone.replace(/\D/g, "").slice(-10);

  const cleanupRecaptcha = useCallback(() => {
    if (typeof window !== "undefined" && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Ignored
      }
      window.recaptchaVerifier = undefined;
    }
    const container = document.getElementById("checkout-recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  }, []);

  const triggerSendOtp = useCallback(
    async (isResend = false) => {
      if (!cleanedPhone || cleanedPhone.length !== 10) {
        setErrorMessage("A valid 10-digit mobile number is required.");
        return;
      }

      if (isSendingRef.current) return;
      isSendingRef.current = true;
      setIsSendingOtp(true);
      setErrorMessage("");

      if (isResend) {
        verifiedTokenRef.current = null;
        setDigits(["", "", "", "", "", ""]);
      }

      try {
        cleanupRecaptcha();

        const auth = getFirebaseAuth();
        const container = document.getElementById("checkout-recaptcha-container");
        if (!container) {
          throw new Error("Security verification container not found.");
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, "checkout-recaptcha-container", {
          size: "invisible",
          callback: () => {
            // Invisible reCAPTCHA solved automatically
          },
          "expired-callback": () => {
            setErrorMessage("Security verification expired. Please click Resend OTP.");
          },
        });

        const formattedPhone = `+91${cleanedPhone}`;
        const confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          window.recaptchaVerifier
        );

        confirmationResultRef.current = confirmation;
        if (typeof window !== "undefined") {
          window.__checkoutConfirmationResult = confirmation;
        }
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setResendCountdown(45);
        setIsFallbackMode(false);

        if (isResend) {
          toast.success("New OTP sent! If you received multiple SMS messages, please enter the code from the most recent one.", {
            icon: "📱",
            duration: 6000,
            style: { background: "#1a4223", color: "#fff" },
          });
        } else {
          toast.success(`OTP sent to +91 ${cleanedPhone}`, {
            icon: "📱",
            style: { background: "#1a4223", color: "#fff" },
          });
        }

        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } catch (err: any) {
        console.warn("Firebase phone auth notice, activating server verification fallback:", err);
        cleanupRecaptcha();

        let clientErrorMsg = "";
        if (err?.code === "auth/too-many-requests") {
          clientErrorMsg = "Too many OTP requests. Please wait a few minutes before trying again.";
        } else if (err?.code === "auth/captcha-check-failed") {
          clientErrorMsg = "Security reCAPTCHA verification failed. Please try again.";
        }

        try {
          const res = await fetch("/api/checkout/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleanedPhone }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setIsFallbackMode(true);
            setOtpSent(true);
            setResendCountdown(45);

            if (data.devOtp) {
              toast(`Dev OTP: ${data.devOtp}`, {
                icon: "🔑",
                duration: 8000,
              });
            } else {
              toast.success(`Verification code sent to +91 ${cleanedPhone}`);
            }

            setTimeout(() => {
              inputRefs.current[0]?.focus();
            }, 150);
          } else {
            setErrorMessage(clientErrorMsg || data.error || "Unable to send verification code. Please try again.");
          }
        } catch {
          setErrorMessage(clientErrorMsg || "Failed to send OTP. Please check your connection and try again.");
        }
      } finally {
        isSendingRef.current = false;
        setIsSendingOtp(false);
      }
    },
    [cleanedPhone, cleanupRecaptcha]
  );

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && otpSent && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, otpSent, resendCountdown]);

  // Trigger initial OTP send strictly ONCE per modal opening
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredInitialSend.current = false;
      return;
    }

    if (hasTriggeredInitialSend.current) return;
    hasTriggeredInitialSend.current = true;

    const timer = setTimeout(() => {
      triggerSendOtp(false);
    }, 20);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, triggerSendOtp]);

  // Clean up reCAPTCHA when modal unmounts or closes
  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, [cleanupRecaptcha]);

  const handleVerifyOtp = async (e?: React.FormEvent, codeToVerify?: string) => {
    if (e) e.preventDefault();

    if (verifiedTokenRef.current) {
      onVerified(verifiedTokenRef.current);
      return;
    }

    if (isVerifyingRef.current) return;

    const otpCode = (codeToVerify || digits.join("")).trim();
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    isVerifyingRef.current = true;
    setIsVerifying(true);
    setErrorMessage("");

    try {
      let idToken = "";
      const activeConfirmation =
        confirmationResultRef.current ||
        confirmationResult ||
        (typeof window !== "undefined" ? window.__checkoutConfirmationResult : null);

      // 1. If Firebase verification
      if (!isFallbackMode && activeConfirmation) {
        try {
          const result = await activeConfirmation.confirm(otpCode);
          idToken = await result.user.getIdToken();
        } catch (firebaseConfirmErr: any) {
          console.error("Firebase confirm error:", firebaseConfirmErr);
          let friendlyError = "Invalid or expired OTP code. Please check and try again.";
          if (firebaseConfirmErr?.code === "auth/invalid-verification-code") {
            friendlyError =
              "The verification code is incorrect. If you received multiple SMS messages, please enter the code from the most recent SMS.";
          } else if (firebaseConfirmErr?.code === "auth/code-expired") {
            friendlyError = "This verification code has expired. Please click Resend OTP to receive a new code.";
          } else if (firebaseConfirmErr?.code === "auth/session-expired") {
            friendlyError = "Verification session expired. Please click Resend OTP to request a new code.";
          } else if (firebaseConfirmErr?.code === "auth/too-many-requests") {
            friendlyError = "Too many attempts. Please wait a few minutes before trying again.";
          } else if (firebaseConfirmErr?.message) {
            friendlyError = firebaseConfirmErr.message;
          }
          throw new Error(friendlyError);
        }
      }

      // 2. Call backend verification to generate signed phoneVerificationToken
      const verifyRes = await fetch("/api/checkout/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanedPhone,
          otp: otpCode,
          isFirebase: !isFallbackMode && Boolean(activeConfirmation),
          idToken,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success || !verifyData.token) {
        throw new Error(verifyData.error || "Verification failed. Please try again.");
      }

      toast.success("Mobile number verified successfully!", {
        icon: "✅",
        duration: 2500,
        style: { background: "#1a4223", color: "#fff" },
      });

      cleanupRecaptcha();
      if (typeof window !== "undefined") {
        delete window.__checkoutConfirmationResult;
      }
      verifiedTokenRef.current = verifyData.token;
      onVerified(verifyData.token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP code. Please check and try again.";
      setErrorMessage(msg);
    } finally {
      isVerifyingRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");

    // Handle paste of full or partial code
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split("");
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (pasteDigits[i]) {
          newDigits[i] = pasteDigits[i];
        }
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      const fullCode = newDigits.join("").trim();
      if (fullCode.length === 6 && !newDigits.includes("")) {
        setTimeout(() => {
          handleVerifyOtp(undefined, fullCode);
        }, 50);
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1);
    setDigits(newDigits);
    setErrorMessage("");

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join("").trim();
    if (fullCode.length === 6 && !newDigits.includes("")) {
      setTimeout(() => {
        handleVerifyOtp(undefined, fullCode);
      }, 50);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay with blur */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="checkout-recaptcha-container" />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Luxury top bar */}
        <div className="bg-gradient-to-r from-[#8a3b34] via-[#A0463E] to-[#6b251f] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <ShieldCheck size={20} className="text-emerald-300" />
              </div>
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                  2-Factor Authentication
                </h3>
                <p className="text-[11px] text-white/80 font-medium">
                  Mobile OTP Verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-6 space-y-5">
          {/* Order Context & Anti-fraud badge */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5">
            <Lock size={15} className="text-emerald-700 mt-0.5 shrink-0" />
            <div className="text-[11.5px] text-emerald-900 leading-snug">
              <span className="font-bold">Protecting Your Order:</span> To prevent fraudulent and fake orders, please verify your mobile number.
            </div>
          </div>

          {/* Phone pill */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <Smartphone size={16} className="text-[#A0463E]" />
              <span className="font-semibold text-gray-500">Sent to:</span>
              <span className="font-black text-black tracking-wide">+91 {cleanedPhone}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-[#A0463E] hover:underline font-bold"
            >
              Change
            </button>
          </div>

          {/* Error alert */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 text-center mb-3">
                Enter 6-Digit Verification Code
              </label>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying || isSendingOtp}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:border-[#A0463E] focus:ring-2 focus:ring-[#A0463E]/20 outline-none transition-all bg-white text-gray-900 shadow-xs disabled:bg-gray-100"
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-500 font-medium">Didn&apos;t receive code?</span>
              {resendCountdown > 0 ? (
                <span className="text-gray-400 font-semibold flex items-center gap-1">
                  Resend in <strong className="text-gray-700">{resendCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerSendOtp(true)}
                  disabled={isSendingOtp || isVerifying}
                  className="text-[#A0463E] hover:text-black font-extrabold flex items-center gap-1 transition-colors uppercase tracking-wider text-[11px]"
                >
                  <RotateCcw size={12} className={isSendingOtp ? "animate-spin" : ""} />
                  {isSendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isVerifying || digits.join("").length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-[#A0463E] hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#A0463E]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying OTP & Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isCod
                        ? `VERIFY & PLACE COD ORDER (${formattedAmount})`
                        : `VERIFY & PROCEED TO PAYMENT (${formattedAmount})`}
                    </span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel & Review Order
              </button>
            </div>
          </form>

          {/* Trust Footer */}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-center gap-2 text-[10.5px] text-gray-400 font-semibold">
            <Lock size={12} />
            <span>256-Bit Encrypted • Verified Genuine Customer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

