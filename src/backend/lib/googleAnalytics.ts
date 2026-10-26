// src/backend/lib/googleAnalytics.ts

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "G-V5JYX7N418";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Log pageview in Google Analytics
 */
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Log custom event in Google Analytics
 */
export const trackGAEvent = (action: string, params: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};

/**
 * Standard GA4 E-commerce: view_item
 */
export const trackGAViewItem = ({
  id,
  name,
  category,
  price,
  currency = "INR",
}: {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
}) => {
  trackGAEvent("view_item", {
    currency,
    value: price || 0,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        price: price || 0,
        quantity: 1,
      },
    ],
  });
};

/**
 * Standard GA4 E-commerce: add_to_cart
 */
export const trackGAAddToCart = ({
  id,
  name,
  category,
  price,
  quantity = 1,
  size,
  color,
  currency = "INR",
}: {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  size?: string | null;
  color?: string | null;
  currency?: string;
}) => {
  trackGAEvent("add_to_cart", {
    currency,
    value: (price || 0) * quantity,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        item_variant: [size, color].filter(Boolean).join(" / ") || undefined,
        price: price || 0,
        quantity,
      },
    ],
  });
};

/**
 * Standard GA4 E-commerce: remove_from_cart
 */
export const trackGARemoveFromCart = ({
  id,
  name,
  category,
  price,
  quantity = 1,
  size,
  color,
  currency = "INR",
}: {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
  size?: string | null;
  color?: string | null;
  currency?: string;
}) => {
  trackGAEvent("remove_from_cart", {
    currency,
    value: (price || 0) * quantity,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        item_variant: [size, color].filter(Boolean).join(" / ") || undefined,
        price: price || 0,
        quantity,
      },
    ],
  });
};

/**
 * Standard GA4 E-commerce: begin_checkout
 */
export const trackGABeginCheckout = ({
  items = [],
  value = 0,
  currency = "INR",
  coupon,
}: {
  items?: any[];
  value?: number;
  currency?: string;
  coupon?: string;
}) => {
  trackGAEvent("begin_checkout", {
    currency,
    value,
    coupon,
    items: items.map((i) => ({
      item_id: i.productId || i.id,
      item_name: i.name || i.productName,
      price: Number(i.price) || 0,
      quantity: i.quantity || 1,
      item_variant: [i.size, i.color].filter(Boolean).join(" / ") || undefined,
    })),
  });
};

/**
 * Standard GA4 E-commerce: purchase
 */
export const trackGAPurchase = ({
  transactionId,
  value = 0,
  currency = "INR",
  tax = 0,
  shipping = 0,
  coupon,
  items = [],
}: {
  transactionId: string;
  value?: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items?: any[];
}) => {
  trackGAEvent("purchase", {
    transaction_id: transactionId,
    value,
    currency,
    tax,
    shipping,
    coupon,
    items: items.map((i) => ({
      item_id: i.productId || i.id,
      item_name: i.name || i.productName,
      price: Number(i.price) || 0,
      quantity: i.quantity || 1,
      item_variant: [i.size, i.color].filter(Boolean).join(" / ") || undefined,
    })),
  });
};

/**
 * Standard GA4: search
 */
export const trackGASearch = (searchTerm: string) => {
  if (searchTerm) {
    trackGAEvent("search", {
      search_term: searchTerm,
    });
  }
};
