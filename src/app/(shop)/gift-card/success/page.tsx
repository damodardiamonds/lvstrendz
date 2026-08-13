import { Metadata } from "next";
import { Suspense } from "react";
import GiftCardSuccessClient from "./GiftCardSuccessClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Gift Card Purchase Success | LV's Trendz",
  description: "Thank you for your gift card purchase. Share your code via WhatsApp, Email, or Web Share.",
};

export default function GiftCardSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] py-20">
          <Loader2 size={36} className="animate-spin text-[#A0463E] mb-3" />
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
            Loading Gift Card Details...
          </p>
        </div>
      }
    >
      <GiftCardSuccessClient />
    </Suspense>
  );
}
