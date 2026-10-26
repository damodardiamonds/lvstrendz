// src/frontend/lib/cartTracker.ts

export interface CartTrackItemPayload {
  productId: string;
  name?: string;
  slug?: string | null;
  image?: string | null;
  variantId?: string | null;
  sku?: string | null;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  customMeasurements?: any;
}

export interface CustomerInfoPayload {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

const SESSION_KEY = "lvs_cart_session_id";

/**
 * Returns or creates a persistent session ID for the shopper's cart.
 */
export function getCartSessionId(): string {
  if (typeof window === "undefined") return "server_session";

  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId =
        "cart_" +
        Math.random().toString(36).substring(2, 9) +
        "_" +
        Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    // Also mirror into cookie for server route handlers
    if (!document.cookie.includes(`${SESSION_KEY}=`)) {
      document.cookie = `${SESSION_KEY}=${sessionId}; path=/; max-age=2592000; SameSite=Lax`;
    }

    return sessionId;
  } catch {
    return "anonymous_session";
  }
}

/**
 * Sends a tracking event to the cart tracker API.
 */
async function sendCartEvent(
  action: "ADD" | "UPDATE_QTY" | "REMOVE" | "ORDERED" | "SYNC",
  payload: {
    item?: CartTrackItemPayload;
    items?: CartTrackItemPayload[];
    customer?: CustomerInfoPayload;
  }
) {
  if (typeof window === "undefined") return;

  try {
    const sessionId = getCartSessionId();

    const body = {
      action,
      sessionId,
      item: payload.item,
      items: payload.items,
      customer: payload.customer,
    };

    fetch("/api/cart/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Non-blocking fail-safe
    });
  } catch (err) {
    console.debug("[cart-tracker] Event tracking skipped:", err);
  }
}

/**
 * Track an item added to cart
 */
export function trackAddToCartEvent(
  item: CartTrackItemPayload,
  customer?: CustomerInfoPayload
) {
  sendCartEvent("ADD", { item, customer });
}

/**
 * Track quantity update in cart
 */
export function trackUpdateCartQuantityEvent(
  item: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    size?: string | null;
    color?: string | null;
  },
  customer?: CustomerInfoPayload
) {
  sendCartEvent("UPDATE_QTY", {
    item: {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: 0,
    },
    customer,
  });
}

/**
 * Track item removed from cart
 */
export function trackRemoveFromCartEvent(
  item: {
    productId: string;
    variantId?: string | null;
    size?: string | null;
    color?: string | null;
    name?: string;
  },
  customer?: CustomerInfoPayload
) {
  sendCartEvent("REMOVE", {
    item: {
      productId: item.productId,
      variantId: item.variantId,
      quantity: 0,
      size: item.size,
      color: item.color,
      name: item.name,
      price: 0,
    },
    customer,
  });
}

/**
 * Track cart order placed / checked out
 */
export function trackCartOrderCompletedEvent(customer?: CustomerInfoPayload) {
  sendCartEvent("ORDERED", { customer });
}

/**
 * Sync entire current cart with backend
 */
export function syncEntireCart(
  items: CartTrackItemPayload[],
  customer?: CustomerInfoPayload
) {
  sendCartEvent("SYNC", { items, customer });
}
