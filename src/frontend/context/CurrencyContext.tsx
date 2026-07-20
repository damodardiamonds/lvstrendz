
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode, detectCurrency, formatPrice } from "@/lib/currency";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  format: (priceInINR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem("lvstrendz_currency", newCurrency);
    } catch (e) {
      console.error("Failed to save currency preference", e);
    }
  };

  useEffect(() => {
    // 1. Respect saved user preference if available
    try {
      const saved = localStorage.getItem("lvstrendz_currency");
      if (saved === "INR" || saved === "USD") {
        setCurrencyState(saved as CurrencyCode);
        return;
      }
    } catch {
      // localStorage unavailable or restricted
    }

    // 2. Client-side IP lookup (direct browser call catches VPN IP immediately)
    let isMounted = true;
    fetch("https://api.country.is/", { signal: AbortSignal.timeout(2500) })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && data.country) {
          const detectedCurrency: CurrencyCode = data.country.toUpperCase() === "IN" ? "INR" : "USD";
          setCurrencyState(detectedCurrency);
          return;
        }
        throw new Error("No country in response");
      })
      .catch(() => {
        // Fallback to server endpoint
        fetch("/api/currency/detect", { signal: AbortSignal.timeout(2500) })
          .then((res) => res.json())
          .then((data) => {
            if (isMounted && (data.currency === "INR" || data.currency === "USD")) {
              setCurrencyState(data.currency);
            } else if (isMounted) {
              setCurrencyState(detectCurrency());
            }
          })
          .catch(() => {
            if (isMounted) {
              setCurrencyState(detectCurrency());
            }
          });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const format = (priceInINR: number) => formatPrice(priceInINR, currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

