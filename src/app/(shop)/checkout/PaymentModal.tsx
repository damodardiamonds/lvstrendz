"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  X,
  Loader2,
  Smartphone,
  Landmark,
  QrCode,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
  initialMethod?: "CARD" | "UPI" | "NETBANKING" | "PAYGLOCAL";
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  customerEmail,
  initialMethod = "CARD",
}: PaymentModalProps) {
  const router = useRouter();

  // Selected tab: "CARD" | "UPI" | "NETBANKING"
  const [activeTab, setActiveTab] = useState<"CARD" | "UPI" | "NETBANKING">(
    initialMethod === "PAYGLOCAL" ? "CARD" : initialMethod
  );

  // Sync initial tab when modal opens or initialMethod prop changes
  useEffect(() => {
    if (initialMethod && initialMethod !== "PAYGLOCAL") {
      setActiveTab(initialMethod);
    }
  }, [initialMethod, isOpen]);

  // Step state: 1 = Enter Details / Choose Bank, 2 = 3D Secure / OTP Simulation
  const [step, setStep] = useState<1 | 2>(1);

  // Card Form state
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  // UPI state
  const [upiSubTab, setUpiSubTab] = useState<"QR" | "ID">("QR");
  const [upiId, setUpiId] = useState("");

  // Netbanking Bank state
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // OTP Verification state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState(60);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOtp("");
      setOtpError("");
      setIsProcessing(false);
      setTimer(60);
    }
  }, [isOpen]);

  // OTP Timer Countdown when step === 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  if (!isOpen) return null;

  // Format currency in INR
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Card Brand Detection
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean)) return "MasterCard";
    if (/^60|^65|^81|^82/.test(clean)) return "RuPay";
    if (/^3[47]/.test(clean)) return "American Express";
    return "Card";
  };

  // Input Handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.slice(0, 16);
    // Format into groups of 4
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardForm((prev) => ({ ...prev, expiry: val }));
  };

  // Validate Step 1 and proceed to 3D Secure OTP Step 2
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "CARD") {
      const cleanNum = cardForm.cardNumber.replace(/\s+/g, "");
      if (cleanNum.length < 15) {
        toast.error("Please enter a valid 15 or 16-digit card number.");
        return;
      }
      if (!cardForm.cardName.trim()) {
        toast.error("Please enter the name on the card.");
        return;
      }
      if (!cardForm.expiry || !/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
        toast.error("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        toast.error("Please enter a valid 3 or 4-digit CVV.");
        return;
      }
    } else if (activeTab === "UPI" && upiSubTab === "ID") {
      if (!upiId.trim() || !upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g. name@upi or mobile@paytm).");
        return;
      }
    }

    setStep(2);
    setTimer(60);
  };

  // Complete Payment after OTP verification
  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setOtpError("Please enter the 6-digit verification OTP.");
      return;
    }

    setOtpError("");
    setIsProcessing(true);

    try {
      const payload = {
        orderId,
        paymentMethod: activeTab,
        paymentDetails: {
          cardBrand: activeTab === "CARD" ? getCardBrand(cardForm.cardNumber) : undefined,
          cardNumber: activeTab === "CARD" ? cardForm.cardNumber : undefined,
          upiId: activeTab === "UPI" ? (upiSubTab === "ID" ? upiId : "Instant QR Scan") : undefined,
          bankName: activeTab === "NETBANKING" ? selectedBank : undefined,
        },
      };

      const res = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Payment Successful! Processing order...", {
          style: { background: "#1a4223", color: "#fff" },
          duration: 3000,
        });

        // Clear local storage cart
        localStorage.removeItem("lvstrendz_cart");
        localStorage.removeItem("lvstrendz_coupon");
        window.dispatchEvent(new Event("cartUpdated"));

        // Redirect to Order Received page
        router.push(`/checkout/order-received?orderNumber=${data.orderNumber}`);
        onClose();
      } else {
        throw new Error(data.error || "Payment verification failed.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const popularBanks = [
    { code: "HDFC", name: "HDFC Bank" },
    { code: "ICICI", name: "ICICI Bank" },
    { code: "SBI", name: "State Bank of India" },
    { code: "AXIS", name: "Axis Bank" },
    { code: "KOTAK", name: "Kotak Mahindra" },
    { code: "BOB", name: "Bank of Baroda" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#A0463E] flex items-center justify-center text-white shadow-xs font-black text-sm">
              LVS
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                LVS TRENDZ Payment Gateway
              </h3>
              <p className="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" />
                256-Bit SSL Encrypted Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close Payment Gateway"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Info Strip */}
        <div className="bg-amber-50/80 border-b border-amber-100 px-6 py-2.5 flex justify-between items-center text-xs shrink-0 font-semibold text-amber-900">
          <div>
            <span>Order #: </span>
            <span className="font-extrabold text-black">{orderNumber}</span>
          </div>
          <div>
            <span>Total Amount: </span>
            <span className="font-black text-[#A0463E] text-sm">{formatINR(totalAmount)}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          
          {step === 1 ? (
            <>
              {/* Payment Channel Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setActiveTab("CARD")}
                  className={`py-3 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    activeTab === "CARD"
                      ? "bg-white text-[#A0463E] shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("UPI")}
                  className={`py-3 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    activeTab === "UPI"
                      ? "bg-white text-[#A0463E] shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <Smartphone size={18} />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("NETBANKING")}
                  className={`py-3 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    activeTab === "NETBANKING"
                      ? "bg-white text-[#A0463E] shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <Landmark size={18} />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Tab 1: Credit / Debit Card Form */}
              {activeTab === "CARD" && (
                <form onSubmit={handleProceedToOtp} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Card Number
                      </label>
                      <span className="text-[11px] font-black text-[#A0463E] uppercase tracking-wider">
                        {getCardBrand(cardForm.cardNumber)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 0123 4567 8901"
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none pr-10"
                        required
                      />
                      <CreditCard
                        size={18}
                        className="absolute right-3.5 top-3.5 text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardForm.cardName}
                      onChange={(e) =>
                        setCardForm((prev) => ({ ...prev, cardName: e.target.value }))
                      }
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardForm.expiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        value={cardForm.cvv}
                        onChange={(e) =>
                          setCardForm((prev) => ({
                            ...prev,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Pay {formatINR(totalAmount)}</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}

              {/* Tab 2: UPI / QR Code */}
              {activeTab === "UPI" && (
                <div className="space-y-4">
                  <div className="flex border-b border-gray-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUpiSubTab("QR")}
                      className={`pb-2 px-4 transition ${
                        upiSubTab === "QR"
                          ? "border-b-2 border-[#A0463E] text-[#A0463E]"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      Instant QR Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiSubTab("ID")}
                      className={`pb-2 px-4 transition ${
                        upiSubTab === "ID"
                          ? "border-b-2 border-[#A0463E] text-[#A0463E]"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      Enter UPI ID / VPA
                    </button>
                  </div>

                  {upiSubTab === "QR" ? (
                    <div className="text-center space-y-4 py-2">
                      <div className="w-44 h-44 border-2 border-dashed border-[#A0463E]/40 rounded-2xl bg-gray-50 p-3 mx-auto flex flex-col items-center justify-center relative shadow-inner">
                        {/* Dynamic QR Code representation */}
                        <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center border border-gray-100 shadow-2xs">
                          <QrCode size={110} className="text-gray-900" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Scan with <span className="font-bold text-black">GPay</span>,{" "}
                        <span className="font-bold text-black">PhonePe</span>, or{" "}
                        <span className="font-bold text-black">Paytm</span> to authorize payment.
                      </p>
                      <button
                        type="button"
                        onClick={handleProceedToOtp}
                        className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>I Have Scanned & Paid ({formatINR(totalAmount)})</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProceedToOtp} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                          UPI ID / Virtual Address
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">
                        A payment collect request will be sent to your UPI app.
                      </p>
                      <button
                        type="submit"
                        className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>Verify & Pay {formatINR(totalAmount)}</span>
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 3: Net Banking */}
              {activeTab === "NETBANKING" && (
                <div className="space-y-4">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Select Your Bank
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    {popularBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                          selectedBank === bank.name
                            ? "border-[#A0463E] bg-[#A0463E]/5 text-[#A0463E] shadow-2xs"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Landmark size={14} className="text-[#A0463E]" />
                        <span>{bank.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Or Choose from all Indian Banks
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none bg-white"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                      <option value="Canara Bank">Canara Bank</option>
                      <option value="Union Bank of India">Union Bank of India</option>
                      <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToOtp}
                    className="w-full bg-[#A0463E] hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    <span>Pay {formatINR(totalAmount)} via {selectedBank}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Step 2: 3D Secure / OTP Verification Screen */
            <form onSubmit={handleCompletePayment} className="space-y-5 py-2 animate-fade-in">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
                  Bank 3D-Secure 2FA Verification
                </h4>
                <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
                  Enter the 6-digit authentication code sent to your mobile & registered email (<span className="font-bold text-black">{customerEmail}</span>).
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp("123456");
                      setOtpError("");
                    }}
                    className="text-[11px] font-extrabold text-[#A0463E] hover:underline"
                  >
                    Auto-Fill Demo OTP (123456)
                  </button>
                </div>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full text-center tracking-[0.5em] text-lg font-black px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none bg-gray-50/50"
                  required
                />
                {otpError && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1 justify-center">
                    <AlertCircle size={12} /> {otpError}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>
                  Resend OTP in: <span className="font-bold text-black">{timer}s</span>
                </span>
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={() => setTimer(60)}
                  className="text-[#A0463E] hover:underline disabled:text-gray-300 disabled:no-underline font-bold"
                >
                  Resend OTP
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isProcessing}
                  className="w-1/3 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 bg-[#A0463E] hover:bg-black disabled:bg-[#A0463E]/70 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <span>Submit & Pay {formatINR(totalAmount)}</span>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Security Badges */}
        <div className="bg-gray-50 border-t border-gray-150 px-6 py-3 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-500" />
            <span>PCI-DSS Level 1 Compliant</span>
          </div>
          <span>Powered by LVS TRENDZ</span>
        </div>

      </div>
    </div>
  );
}
