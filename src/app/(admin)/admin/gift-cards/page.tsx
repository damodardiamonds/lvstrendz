import { Metadata } from "next";
import AdminGiftCardsClient from "./AdminGiftCardsClient";

export const metadata: Metadata = {
  title: "Gift Card Offers Management | Admin Panel",
  description: "Create and manage discounted gift card offers, stock limits, and customer purchases.",
};

export default function AdminGiftCardsPage() {
  return <AdminGiftCardsClient />;
}
