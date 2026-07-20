"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface FormattedPriceProps {
  price: number;
  className?: string;
}

export default function FormattedPrice({ price, className }: FormattedPriceProps) {
  const { format } = useCurrency();
  return <span className={className}>{format(price)}</span>;
}
