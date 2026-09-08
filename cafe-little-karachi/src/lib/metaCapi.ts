// src/lib/metaCapi.ts
//
// Meta Conversions API (CAPI) Server-Side Integration
// Pixel ID: 1619761243277122

import crypto from 'crypto';

export const META_PIXEL_ID =
  process.env.META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  '1619761243277122';

export const META_CAPI_ACCESS_TOKEN =
  process.env.META_CONVERSIONS_API_TOKEN ||
  'EAAeleaN2ZAosBSQcOXGJZBSp59YTvwXSgmkeRBH5QduNOdAX6TKLhZCfFRZCl2S3LpOYxsscoXQX1Ey7zO86oOLA2fQMZAfUOpxmpaOBBXGqZBuixtHTFWVhsa90zgt3VLrg3ToeXrZBL2lqcJjfCg99w94nrqw2ZAfooOtWN4bbT5Ic43Ys7KPaqDuEgbADGAZDZD';

export const META_GRAPH_API_VERSION = 'v21.0';

/**
 * SHA-256 hash a normalized string according to Meta specifications.
 */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

/**
 * Normalize and hash email for Meta CAPI.
 */
export function hashEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return null;
  return sha256(clean);
}

/**
 * Normalize and hash phone number for Meta CAPI.
 * Standardizes Pakistani mobile numbers (e.g. 03001234567 -> 923001234567).
 */
export function hashPhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, ''); // strip all non-digits

  if (!digits) return null;

  // Pakistani phone normalization
  if (digits.startsWith('03') && digits.length === 11) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.slice(2);
  }

  return sha256(digits);
}

export interface MetaCapiUserData {
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface MetaCapiCustomData {
  currency?: string;
  value?: number;
  contents?: Array<{
    id: string | number;
    quantity: number;
    item_price?: number;
    title?: string;
  }>;
  content_type?: string;
  content_name?: string;
  content_category?: string;
  order_id?: string;
  num_items?: number;
  [key: string]: any;
}

export interface SendMetaCapiEventOptions {
  eventName: 'Purchase' | 'InitiateCheckout' | 'AddToCart' | 'ViewContent' | 'PageView' | string;
  eventId?: string;
  eventSourceUrl?: string;
  userData?: MetaCapiUserData;
  customData?: MetaCapiCustomData;
  testEventCode?: string; // Optional test event code for Meta Events Manager test tool
}

/**
 * Send a server-side event to Meta Conversions API.
 * Non-blocking / fire-and-forget safe.
 */
export async function sendMetaCapiEvent(
  options: SendMetaCapiEventOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const pixelId = META_PIXEL_ID;
  const token = META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    console.warn('[MetaCapi] Missing META_PIXEL_ID or META_CONVERSIONS_API_TOKEN');
    return { success: false, error: 'Missing credentials' };
  }

  const {
    eventName,
    eventId,
    eventSourceUrl = 'https://cafelittlekarachi.com',
    userData = {},
    customData = {},
    testEventCode,
  } = options;

  // Build hashed user_data
  const formattedUserData: Record<string, any> = {};

  const hashedEm = hashEmail(userData.email);
  if (hashedEm) formattedUserData.em = [hashedEm];

  const hashedPh = hashPhone(userData.phone);
  if (hashedPh) formattedUserData.ph = [hashedPh];

  if (userData.firstName) {
    formattedUserData.fn = [sha256(userData.firstName.trim().toLowerCase())];
  }
  if (userData.lastName) {
    formattedUserData.ln = [sha256(userData.lastName.trim().toLowerCase())];
  }

  if (userData.clientIp) {
    formattedUserData.client_ip_address = userData.clientIp;
  }
  if (userData.clientUserAgent) {
    formattedUserData.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbp) {
    formattedUserData.fbp = userData.fbp;
  }
  if (userData.fbc) {
    formattedUserData.fbc = userData.fbc;
  }

  // Format custom data
  const formattedCustomData: Record<string, any> = {
    currency: customData.currency || 'PKR',
    value: typeof customData.value === 'number' ? customData.value : 0,
    content_type: customData.content_type || 'product',
  };

  if (customData.order_id) {
    formattedCustomData.order_id = customData.order_id;
  }

  if (customData.contents && Array.isArray(customData.contents)) {
    formattedCustomData.contents = customData.contents.map((item) => ({
      id: String(item.id),
      quantity: item.quantity || 1,
      item_price: typeof item.item_price === 'number' ? item.item_price : undefined,
    }));
    formattedCustomData.content_ids = customData.contents.map((item) => String(item.id));
    formattedCustomData.num_items =
      customData.num_items ||
      customData.contents.reduce((sum, it) => sum + (it.quantity || 1), 0);
  }

  const eventPayload: Record<string, any> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: formattedUserData,
    custom_data: formattedCustomData,
  };

  if (eventId) {
    eventPayload.event_id = eventId;
  }

  const body: Record<string, any> = {
    data: [eventPayload],
  };

  if (testEventCode || process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = testEventCode || process.env.META_TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      token
    )}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn('[MetaCapi] Error response from Meta Graph API:', result);
      return { success: false, error: result.error?.message || 'Meta API error', data: result };
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.warn('[MetaCapi] Request exception:', error);
    return { success: false, error: error.message };
  }
}
