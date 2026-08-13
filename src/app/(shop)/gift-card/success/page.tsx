import { Metadata } from "next";
import GiftCardSuccessClient from "./GiftCardSuccessClient";

export const metadata: Metadata = {
  title: "Gift Card Purchase Success | LV's Trendz",
  description: "Thank you for your gift card purchase. Share your code via WhatsApp, Email, or Web Share.",
};

export default function GiftCardSuccessPage() {
  return <GiftCardSuccessClient />;
}
