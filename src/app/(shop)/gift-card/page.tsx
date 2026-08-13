import { Metadata } from "next";
import GiftCardClient from "./GiftCardClient";

export const metadata: Metadata = {
  title: "Gift Card (₹1000 Value for ₹500) | LV's Trendz",
  description:
    "Buy a ₹1,000 digital Gift Card for only ₹500. Redeemable on all couture & luxury fashion at LV's Trendz or send as a personalized gift to a loved one.",
  openGraph: {
    title: "₹1000 Digital Gift Card for ₹500 | LV's Trendz",
    description: "Special offer: Get ₹1,000 fashion gift card for just ₹500 at LV's Trendz.",
  },
};

export default function GiftCardPage() {
  return <GiftCardClient />;
}
