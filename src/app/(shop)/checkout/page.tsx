import React from "react";
import CheckoutClient from "./CheckoutClient";

export const revalidate = 0; // Don't cache checkout page

export default function CheckoutPage() {
  return <CheckoutClient />;
}
