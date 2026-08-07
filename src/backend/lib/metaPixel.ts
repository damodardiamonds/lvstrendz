export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '893855847063106';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, options);
  }
};

export const trackViewContent = ({
  id,
  name,
  category,
  price,
  currency = 'INR',
}: {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: id ? [id] : [],
      content_name: name,
      content_category: category,
      value: price || 0,
      currency: currency,
      content_type: 'product',
    });
  }
};

export const trackAddToCart = ({
  id,
  name,
  price,
  quantity = 1,
  currency = 'INR',
}: {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: id ? [id] : [],
      content_name: name,
      value: (price || 0) * quantity,
      currency: currency,
      content_type: 'product',
    });
  }
};

export const trackInitiateCheckout = ({
  items = [],
  value = 0,
  currency = 'INR',
}: {
  items?: any[];
  value?: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const contentIds = items.map((i) => i.productId || i.id).filter(Boolean);
    const numItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    window.fbq('track', 'InitiateCheckout', {
      content_ids: contentIds,
      num_items: numItems,
      value: value,
      currency: currency,
      content_type: 'product',
    });
  }
};

export const trackPurchase = ({
  orderId,
  value = 0,
  currency = 'INR',
  items = [],
}: {
  orderId?: string;
  value?: number;
  currency?: string;
  items?: any[];
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const contentIds = items.map((i) => i.productId || i.id).filter(Boolean);
    const numItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    window.fbq('track', 'Purchase', {
      content_ids: contentIds,
      num_items: numItems,
      value: value,
      currency: currency,
      content_type: 'product',
    });
  }
};

export const trackSearch = (searchQuery: string) => {
  if (typeof window !== 'undefined' && window.fbq && searchQuery) {
    window.fbq('track', 'Search', {
      search_string: searchQuery,
    });
  }
};
