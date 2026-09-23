// src/app/lib/orderSource.ts
//
// UTM Parameter and Marketing Source Attribution Engine for Cafe Little Karachi (CLK)
// Captures UTM tags, referrers, and tags Microsoft Clarity sessions.

export interface OrderSource {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  label: string;
  capturedAt: string;
}

const STORAGE_KEY = 'clk_order_source';

/**
 * Resolves a human-readable attribution label from source, medium, and referrer.
 */
export function resolveSourceLabel(
  source?: string | null,
  medium?: string | null,
  campaign?: string | null,
  referrer?: string | null
): string {
  const s = (source || '').toLowerCase().trim();
  const m = (medium || '').toLowerCase().trim();
  const ref = (referrer || '').toLowerCase().trim();

  // 1. Explicit UTM Source matching
  if (s.includes('facebook') || s.includes('fb') || s === 'meta' || s.includes('fb_ad')) {
    return m.includes('ad') || m.includes('paid') || m.includes('cpc') || m.includes('social')
      ? 'Facebook Ads'
      : 'Facebook';
  }

  if (s.includes('instagram') || s.includes('ig') || s.includes('insta')) {
    return m.includes('ad') || m.includes('paid') || m.includes('cpc') || m.includes('social')
      ? 'Instagram Ads'
      : 'Instagram';
  }

  if (s.includes('google')) {
    return m.includes('cpc') || m.includes('ad') || m.includes('ppc')
      ? 'Google Ads'
      : 'Google Search';
  }

  if (s.includes('tiktok') || s.includes('tt')) {
    return m.includes('ad') || m.includes('paid') ? 'TikTok Ads' : 'TikTok';
  }

  if (s.includes('whatsapp') || s.includes('wa')) {
    return 'WhatsApp';
  }

  if (s.includes('snapchat') || s.includes('snap')) {
    return 'Snapchat Ads';
  }

  if (s) {
    return `${s.charAt(0).toUpperCase() + s.slice(1)}${m ? ` (${m})` : ''}`;
  }

  // 2. Referrer Domain detection fallback
  if (ref) {
    if (ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('m.facebook.com')) {
      return 'Facebook';
    }
    if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
      return 'Instagram';
    }
    if (ref.includes('google.com') || ref.includes('google.com.pk')) {
      return 'Google Search';
    }
    if (ref.includes('tiktok.com')) {
      return 'TikTok';
    }
    if (ref.includes('whatsapp.com') || ref.includes('api.whatsapp.com')) {
      return 'WhatsApp';
    }
    try {
      const urlObj = new URL(ref);
      if (urlObj.hostname && !urlObj.hostname.includes('cafelittlekarachi.com') && !urlObj.hostname.includes('localhost')) {
        return `Referral: ${urlObj.hostname.replace(/^www\./, '')}`;
      }
    } catch {
      // Ignore URL parse error
    }
  }

  // 3. Fallback
  return 'Direct / Organic';
}

/**
 * Captures UTM parameters from current URL and referrer, saving to sessionStorage.
 * Also tags Microsoft Clarity session with order_source and campaign attributes.
 */
export function captureOrderSource(): OrderSource | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    const utmTerm = urlParams.get('utm_term');
    const referrer = document.referrer || '';
    const landingPage = window.location.pathname + window.location.search;

    const hasUtm = Boolean(utmSource || utmMedium || utmCampaign);
    const existingRaw = sessionStorage.getItem(STORAGE_KEY);

    // If we already captured a source and this current page has no new UTM tags, keep existing
    if (existingRaw && !hasUtm) {
      try {
        const existing = JSON.parse(existingRaw) as OrderSource;
        return existing;
      } catch {
        // Parse error, overwrite below
      }
    }

    const label = resolveSourceLabel(utmSource, utmMedium, utmCampaign, referrer);

    const sourceData: OrderSource = {
      source: utmSource || (referrer ? 'referrer' : 'direct'),
      medium: utmMedium || undefined,
      campaign: utmCampaign || undefined,
      content: utmContent || undefined,
      term: utmTerm || undefined,
      referrer: referrer || undefined,
      landingPage,
      label,
      capturedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sourceData));

    // Tag Microsoft Clarity session
    if (typeof (window as any).clarity === 'function') {
      (window as any).clarity('set', 'order_source', label);
      if (utmCampaign) {
        (window as any).clarity('set', 'campaign', utmCampaign);
      }
      if (utmMedium) {
        (window as any).clarity('set', 'utm_medium', utmMedium);
      }
    }

    return sourceData;
  } catch (err) {
    console.warn('[OrderSource] Failed to capture attribution:', err);
    return null;
  }
}

/**
 * Retrieves the currently captured OrderSource from sessionStorage.
 */
export function getOrderSource(): OrderSource {
  if (typeof window === 'undefined') {
    return {
      source: 'direct',
      label: 'Direct / Organic',
      capturedAt: new Date().toISOString(),
    };
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[OrderSource] Failed to read stored source:', err);
  }

  // Fallback if none captured
  return {
    source: 'direct',
    label: 'Direct / Organic',
    capturedAt: new Date().toISOString(),
  };
}
