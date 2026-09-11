// src/app/lib/metaPixel.ts
//
// Meta Pixel Client-Side Event Helper
// Pixel ID: 1619761243277122

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '1619761243277122';

/**
 * Low-level standard event dispatcher with optional eventID for deduplication with CAPI.
 */
export function fbqTrack(
  eventName: string,
  params: Record<string, any> = {},
  eventId?: string
): void {
  if (typeof window === 'undefined' || !window.fbq) return;

  try {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  } catch (err) {
    console.warn(`[MetaPixel] Failed to track ${eventName}:`, err);
  }
}

/**
 * Low-level custom event dispatcher.
 */
export function fbqCustom(
  customEventName: string,
  params: Record<string, any> = {},
  eventId?: string
): void {
  if (typeof window === 'undefined' || !window.fbq) return;

  try {
    if (eventId) {
      window.fbq('trackCustom', customEventName, params, { eventID: eventId });
    } else {
      window.fbq('trackCustom', customEventName, params);
    }
  } catch (err) {
    console.warn(`[MetaPixel] Failed to trackCustom ${customEventName}:`, err);
  }
}

/**
 * Track PageView event.
 */
export function trackMetaPageView(): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq('track', 'PageView');
  } catch (err) {
    console.warn('[MetaPixel] Failed to track PageView:', err);
  }
}

/**
 * Track ViewContent event (when browsing a menu item or platter modal).
 */
export function trackMetaViewContent(data: {
  id?: string | number;
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
}): void {
  fbqTrack('ViewContent', {
    content_name: data.name || 'Menu Item',
    content_category: data.category || 'Food',
    content_ids: data.id ? [String(data.id)] : undefined,
    content_type: 'product',
    value: typeof data.price === 'number' ? data.price : 0,
    currency: data.currency || 'PKR',
  });
}

/**
 * Track AddToCart event.
 */
export function trackMetaAddToCart(
  data: {
    id?: string | number;
    name?: string;
    category?: string;
    price?: number;
    quantity?: number;
    currency?: string;
  },
  eventId?: string
): void {
  const quantity = data.quantity || 1;
  const unitPrice = typeof data.price === 'number' ? data.price : 0;
  const value = unitPrice * quantity;

  fbqTrack(
    'AddToCart',
    {
      content_name: data.name || 'Menu Item',
      content_category: data.category || 'Food',
      content_ids: data.id ? [String(data.id)] : undefined,
      content_type: 'product',
      value,
      currency: data.currency || 'PKR',
      contents: data.id
        ? [
            {
              id: String(data.id),
              quantity,
              item_price: unitPrice,
            },
          ]
        : undefined,
    },
    eventId
  );
}

/**
 * Track InitiateCheckout event.
 */
export function trackMetaInitiateCheckout(
  data: {
    items?: Array<{ id: string | number; title?: string; price?: number; quantity?: number }>;
    totalAmount?: number;
    currency?: string;
    numItems?: number;
  },
  eventId?: string
): void {
  const items = data.items || [];
  const contents = items.map((it) => ({
    id: String(it.id),
    quantity: it.quantity || 1,
    item_price: it.price || 0,
  }));
  const contentIds = items.map((it) => String(it.id));

  fbqTrack(
    'InitiateCheckout',
    {
      content_ids: contentIds,
      contents,
      content_type: 'product',
      value: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
      currency: data.currency || 'PKR',
      num_items: data.numItems || items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    },
    eventId
  );
}

/**
 * Track CustomizeProduct event (when customer selects variations, options, or platter choices).
 */
export function trackMetaCustomizeProduct(
  data: {
    id?: string | number;
    name?: string;
    category?: string;
    price?: number;
    currency?: string;
    customizationType?: string;
  },
  eventId?: string
): void {
  fbqTrack(
    'CustomizeProduct',
    {
      content_name: data.name || 'Menu Item Customization',
      content_category: data.category || 'Food',
      content_ids: data.id ? [String(data.id)] : undefined,
      content_type: 'product',
      value: typeof data.price === 'number' ? data.price : 0,
      currency: data.currency || 'PKR',
      customization_type: data.customizationType,
    },
    eventId
  );
}

/**
 * Track AddPaymentInfo event (when selecting or saving payment method in checkout).
 */
export function trackMetaAddPaymentInfo(
  data: {
    paymentMethod?: string;
    totalAmount?: number;
    currency?: string;
    numItems?: number;
  },
  eventId?: string
): void {
  fbqTrack(
    'AddPaymentInfo',
    {
      content_type: 'product',
      value: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
      currency: data.currency || 'PKR',
      payment_method: data.paymentMethod || 'cash',
      num_items: data.numItems,
    },
    eventId
  );
}

/**
 * Track Contact event (clicking Call Us, WhatsApp chat, or support).
 */
export function trackMetaContact(
  data: {
    contactType?: 'phone' | 'whatsapp' | 'email' | string;
    source?: string;
    destination?: string;
  },
  eventId?: string
): void {
  fbqTrack(
    'Contact',
    {
      content_type: 'contact',
      contact_type: data.contactType || 'phone',
      source: data.source || 'header',
      destination: data.destination,
    },
    eventId
  );
}

/**
 * Track FindLocation event (selecting dining mode / delivery area / table number).
 */
export function trackMetaFindLocation(
  data: {
    locationName?: string;
    orderType?: 'delivery' | 'pickup' | 'dinein' | string;
    tableId?: string;
    area?: string;
  },
  eventId?: string
): void {
  fbqTrack(
    'FindLocation',
    {
      content_type: 'location',
      content_name: data.locationName || data.area || (data.tableId ? `Table ${data.tableId}` : 'Restaurant Location'),
      content_category: data.orderType || 'dinein',
      order_type: data.orderType,
      table_id: data.tableId,
      area: data.area,
    },
    eventId
  );
}

/**
 * Track Search event (food item search or category search).
 */
export function trackMetaSearch(
  data: {
    searchString: string;
    contentCategory?: string;
  },
  eventId?: string
): void {
  fbqTrack(
    'Search',
    {
      search_string: data.searchString,
      content_category: data.contentCategory || 'Menu',
    },
    eventId
  );
}

/**
 * Track Lead event (customer feedback submission or inquiry).
 */
export function trackMetaLead(
  data: {
    leadType?: string;
    orderNumber?: string;
    value?: number;
    currency?: string;
  },
  eventId?: string
): void {
  fbqTrack(
    'Lead',
    {
      content_name: data.leadType || 'Order Feedback',
      content_category: 'Lead',
      order_id: data.orderNumber,
      value: typeof data.value === 'number' ? data.value : 0,
      currency: data.currency || 'PKR',
    },
    eventId
  );
}

/**
 * Track Purchase event.
 * Uses orderNumber as eventID to deduplicate with server-side CAPI event.
 */
export function trackMetaPurchase(
  data: {
    orderNumber: string;
    items?: Array<{ id: string | number; title?: string; price?: number; quantity?: number }>;
    totalAmount: number;
    currency?: string;
  }
): void {
  const items = data.items || [];
  const contents = items.map((it) => ({
    id: String(it.id),
    quantity: it.quantity || 1,
    item_price: it.price || 0,
  }));
  const contentIds = items.map((it) => String(it.id));

  fbqTrack(
    'Purchase',
    {
      content_ids: contentIds,
      contents,
      content_type: 'product',
      value: data.totalAmount || 0,
      currency: data.currency || 'PKR',
      num_items: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
      order_id: data.orderNumber,
    },
    data.orderNumber // Event ID for Meta CAPI deduplication
  );
}

