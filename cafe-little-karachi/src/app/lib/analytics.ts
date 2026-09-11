// src/app/lib/analytics.ts
//
// Unified analytics bridge — every call fans out to:
//   1. Internal `/api/analytics/track` endpoint (MongoDB / custom analytics)
//   2. Microsoft Clarity custom events  (session recordings + funnels)
//   3. Meta Pixel & Meta Conversions API (CAPI) events
//
// The Clarity funnel is built around the CLK 10-stage ordering journey.
// Each stage constant maps 1-to-1 with the funnel step configured in the
// Clarity dashboard (Settings → Funnels).

import {
  trackMetaViewContent,
  trackMetaCustomizeProduct,
  trackMetaAddToCart,
  trackMetaInitiateCheckout,
  trackMetaAddPaymentInfo,
  trackMetaPurchase,
  trackMetaContact,
  trackMetaFindLocation,
  trackMetaSearch,
  trackMetaLead,
} from './metaPixel';

// ─── CLK Funnel Event Constants ──────────────────────────────────────────────

/** Stage 1: Customer lands on the home page or sees dining-mode selection. */
export const CLK_FUNNEL_LANDING = 'clk_s1_landing';

/** Stage 2: Customer selects a dining mode (Dine-In / Delivery / Takeaway). */
export const CLK_FUNNEL_MODE_SELECTED = 'clk_s2_mode_selected';

/** Stage 3: Customer selects / confirms a table (Dine-In only). */
export const CLK_FUNNEL_TABLE_SELECTED = 'clk_s3_table_selected';

/** Stage 4: Customer opens the menu and browses categories. */
export const CLK_FUNNEL_MENU_VIEWED = 'clk_s4_menu_viewed';

/** Stage 5: Customer opens the VariationModal to customise an item. */
export const CLK_FUNNEL_ITEM_CUSTOMISED = 'clk_s5_item_customised';

/** Stage 6: Customer adds an item to the cart. */
export const CLK_FUNNEL_ADD_TO_CART = 'clk_s6_add_to_cart';

/** Stage 7: Customer opens the cart / proceeds to checkout. */
export const CLK_FUNNEL_CHECKOUT_STARTED = 'clk_s7_checkout_started';

/** Stage 8: Customer submits the checkout form (Place Order button clicked). */
export const CLK_FUNNEL_ORDER_PLACED = 'clk_s8_order_placed';

/** Stage 9: Order is confirmed and the thank-you page is shown. */
export const CLK_FUNNEL_ORDER_CONFIRMED = 'clk_s9_order_confirmed';

/** Stage 10: Customer reaches the real-time order tracking screen. */
export const CLK_FUNNEL_TRACKING_VIEWED = 'clk_s10_tracking_viewed';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getDistinctId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('custom_distinct_id');
  if (!id) {
    id = 'usr_' + generateUUID();
    localStorage.setItem('custom_distinct_id', id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('custom_session_id');
  if (!id) {
    id = 'ses_' + generateUUID();
    sessionStorage.setItem('custom_session_id', id);
  }
  return id;
}

// ─── Clarity Shim ─────────────────────────────────────────────────────────────

/**
 * Fire a Clarity custom event.
 * Safe to call before the Clarity script loads — Clarity queues early calls.
 */
function fireClarity(eventName: string): void {
  if (typeof window === 'undefined') return;
  (window as any).clarity?.('event', eventName);
}

/**
 * Tag the Clarity session with an arbitrary key/value for segmentation.
 */
function claritySetInternal(key: string, value: string | string[]): void {
  if (typeof window === 'undefined') return;
  (window as any).clarity?.('set', key, value);
}

// ─── CLK Funnel Event → Clarity mapping ──────────────────────────────────────
//
// Maps our internal eventType strings (used in CartContext, checkout page, etc.)
// to the Clarity funnel step event names that correspond to the CLK 10-stage
// ordering journey. When a match is found we fire the mapped Clarity event in
// addition to the internal event, so no changes are needed in call sites.

const CLARITY_EVENT_MAP: Record<string, string> = {
  // Stage 1 — Landing
  journey_landing: CLK_FUNNEL_LANDING,
  // Stage 2 — Dining Mode
  journey_mode_selected: CLK_FUNNEL_MODE_SELECTED,
  // Stage 3 — Table Selection
  journey_table_selected: CLK_FUNNEL_TABLE_SELECTED,
  // Stage 4 — Menu browsed (fired from MenuItem / menu page)
  journey_menu_viewed: CLK_FUNNEL_MENU_VIEWED,
  // Stage 5 — Item customised via VariationModal
  journey_variation_opened: CLK_FUNNEL_ITEM_CUSTOMISED,
  journey_variation_confirmed: CLK_FUNNEL_ITEM_CUSTOMISED,
  // Stage 6 — Add to cart
  journey_add_to_cart: CLK_FUNNEL_ADD_TO_CART,
  journey_add_item: CLK_FUNNEL_ADD_TO_CART,
  // Stage 7 — Checkout started (supports both naming variants)
  journey_checkout_started: CLK_FUNNEL_CHECKOUT_STARTED,
  journey_start_checkout: CLK_FUNNEL_CHECKOUT_STARTED,
  // Stage 8 — Order placed
  journey_order_placed: CLK_FUNNEL_ORDER_PLACED,
  journey_submit_order: CLK_FUNNEL_ORDER_PLACED,
  // Stage 9 — Order confirmed (thank-you page)
  journey_order_success: CLK_FUNNEL_ORDER_CONFIRMED,
  // Stage 10 — Tracking page visited
  journey_tracking_viewed: CLK_FUNNEL_TRACKING_VIEWED,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * trackEvent
 * ----------
 * The single analytics call site used throughout CLK.
 *
 * Fans out to:
 *   - Internal `/api/analytics/track`  (MongoDB logging)
 *   - Clarity custom event             (session recordings + funnel)
 *
 * Fire-and-forget: errors are silently swallowed so tracking NEVER
 * disrupts a customer's checkout flow.
 */
export function trackEvent(eventType: string, properties: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const distinctId = getDistinctId();
  const path = window.location.pathname + window.location.search;

  // ── 1. Internal endpoint (unchanged behaviour) ─────────────────────────────
  const payload = {
    sessionId,
    distinctId,
    eventType,
    path,
    properties,
    timestamp: new Date().toISOString(),
  };

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn('[Analytics] tracking log failed:', err);
  });

  // ── 2. Clarity event (mapped or raw) ──────────────────────────────────────
  const clarityEventName = CLARITY_EVENT_MAP[eventType] ?? eventType;
  fireClarity(clarityEventName);

  // Tag the session with order_type whenever it's present in properties
  if (properties.order_type) {
    claritySetInternal('order_type', properties.order_type);
  }
  if (properties.orderType) {
    claritySetInternal('order_type', properties.orderType);
  }

  // ── 3. Meta Pixel standard events ──────────────────────────────────────────
  try {
    if (
      eventType === 'journey_view_item_details' ||
      eventType === 'journey_view_platter_details'
    ) {
      trackMetaViewContent({
        id: properties.item_id || properties.platter_id || properties.id,
        name: properties.item_name || properties.platter_name || properties.title,
        category: properties.category,
        price: properties.price,
      });
    } else if (
      eventType === 'journey_customise_product' ||
      eventType === 'journey_variation_opened' ||
      eventType === 'journey_variation_confirmed' ||
      eventType === 'journey_variation_select' ||
      eventType === 'journey_platter_option_select' ||
      eventType === 'clk_s5_item_customised'
    ) {
      trackMetaCustomizeProduct({
        id: properties.item_id || properties.platter_id || properties.id,
        name: properties.item_name || properties.platter_name || properties.title,
        category: properties.category,
        price: properties.price,
        customizationType:
          properties.customization_type ||
          properties.variation_name ||
          properties.option_name ||
          properties.choice_heading,
      });
    } else if (
      eventType === 'journey_add_to_cart' ||
      eventType === 'journey_add_item' ||
      eventType === 'journey_add_platter_to_cart' ||
      eventType === 'clk_s6_add_to_cart'
    ) {
      trackMetaAddToCart({
        id: properties.item_id || properties.platter_id || properties.id,
        name: properties.item_name || properties.platter_name || properties.title,
        category: properties.category,
        price: properties.price,
        quantity: properties.quantity,
      });
    } else if (
      eventType === 'journey_checkout_started' ||
      eventType === 'journey_start_checkout' ||
      eventType === 'clk_s7_checkout_started'
    ) {
      trackMetaInitiateCheckout({
        totalAmount: properties.total_amount || properties.totalAmount,
        numItems: properties.item_count || properties.itemCount,
      });
    } else if (
      eventType === 'journey_payment_toggle' ||
      eventType === 'journey_add_payment_info'
    ) {
      trackMetaAddPaymentInfo({
        paymentMethod: properties.method || properties.paymentMethod || properties.payment_method,
        totalAmount: properties.total_amount || properties.totalAmount,
        numItems: properties.item_count || properties.itemCount,
      });
    } else if (
      eventType === 'journey_order_success' ||
      eventType === 'clk_s9_order_confirmed'
    ) {
      const orderNum =
        properties.order_number ||
        properties.orderNumber ||
        properties.order_id ||
        properties.orderId;
      if (orderNum) {
        trackMetaPurchase({
          orderNumber: orderNum,
          totalAmount: properties.total_amount || properties.totalAmount || 0,
        });
      }
    } else if (
      eventType === 'journey_call_click' ||
      eventType === 'journey_whatsapp_click' ||
      eventType === 'journey_contact'
    ) {
      trackMetaContact({
        contactType: properties.channel || properties.contact_type || 'phone',
        source: properties.source || 'header',
        destination: properties.destination,
      });
    } else if (
      eventType === 'journey_table_selected' ||
      eventType === 'journey_area_selected' ||
      eventType === 'journey_find_location' ||
      eventType === 'clk_s3_table_selected'
    ) {
      trackMetaFindLocation({
        orderType: properties.order_type || properties.orderType,
        tableId: properties.table || properties.tableId,
        area: properties.area,
        locationName: properties.location_name || properties.area || (properties.table ? `Table ${properties.table}` : undefined),
      });
    } else if (
      eventType === 'journey_menu_search' ||
      eventType === 'journey_search'
    ) {
      trackMetaSearch({
        searchString: properties.query || properties.search_string || '',
        contentCategory: properties.category,
      });
    } else if (
      eventType === 'journey_feedback_submitted' ||
      eventType === 'journey_lead'
    ) {
      trackMetaLead({
        leadType: properties.lead_type || 'order_feedback',
        orderNumber: properties.order_number || properties.orderNumber,
        value: properties.rating,
      });
    }
  } catch (metaErr) {
    console.warn('[Analytics] Meta Pixel track failed:', metaErr);
  }
}

/**
 * trackClarityFunnelStep
 * ----------------------
 * Directly fire a CLK funnel step constant without going through the internal
 * endpoint. Useful in page-level useEffect hooks where there's no associated
 * properties payload (e.g. "page was viewed" signals).
 *
 * Usage:
 *   trackClarityFunnelStep(CLK_FUNNEL_LANDING);
 */
export function trackClarityFunnelStep(eventConstant: string): void {
  fireClarity(eventConstant);
}
