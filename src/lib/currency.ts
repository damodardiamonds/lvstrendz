
// Currency utility for INR (India) / USD (rest of world)
// Conversion rate: ₹20 = $1

const CONVERSION_RATE = 20; // 20 INR = 1 USD

export type CurrencyCode = "INR" | "USD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

export const currencies: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN" },
  USD: { code: "USD", symbol: "$", locale: "en-US" },
};

/**
 * Detect currency based on user's timezone.
 * If timezone is Asia/Kolkata or Asia/Calcutta → INR, else USD.
 */
export function detectCurrency(): CurrencyCode {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const indiaTimezones = ["Asia/Kolkata", "Asia/Calcutta"];
    return indiaTimezones.includes(timezone) ? "INR" : "USD";
  } catch {
    return "USD";
  }
}

/**
 * Convert INR price to the target currency.
 * All product prices are stored in INR.
 */
export function convertPrice(priceInINR: number, currency: CurrencyCode): number {
  if (currency === "INR") return priceInINR;
  return priceInINR / CONVERSION_RATE;
}

/**
 * Format price with currency symbol.
 */
export function formatPrice(priceInINR: number, currency: CurrencyCode): string {
  const converted = convertPrice(priceInINR, currency);
  const config = currencies[currency];

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: currency === "INR" ? 0 : 2,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(converted);
}

