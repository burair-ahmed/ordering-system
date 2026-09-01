'use client';

import Script from 'next/script';

/**
 * ClarityProvider
 * ---------------
 * Injects the Microsoft Clarity tracking tag using Next.js <Script> with
 * `afterInteractive` strategy so it never blocks the critical render path.
 *
 * Mount once in the root layout (outside Suspense boundaries is fine because
 * this component does not use any router hooks).
 */
export function ClarityProvider() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");
        `,
      }}
    />
  );
}

// ─── Clarity Helper Types ────────────────────────────────────────────────────

type ClarityFn = {
  (method: 'event', eventName: string): void;
  (method: 'set', key: string, value: string | string[]): void;
  (method: 'identify', userId: string, sessionId?: string, pageId?: string, friendlyName?: string): void;
  (method: 'consent'): void;
  (method: 'upgrade', reason: string): void;
  q?: unknown[];
};

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

/**
 * clarityEvent
 * ------------
 * Fire a named Clarity custom event. Safe to call before Clarity has loaded
 * because Clarity queues calls made before the script initialises.
 *
 * Usage:
 *   clarityEvent('clk_add_to_cart');
 */
export function clarityEvent(eventName: string): void {
  if (typeof window === 'undefined') return;
  window.clarity?.('event', eventName);
}

/**
 * claritySet
 * ----------
 * Tag the current session with a custom key/value pair.
 *
 * Usage:
 *   claritySet('order_type', 'dinein');
 *   claritySet('dining_mode', ['dinein', 'table_5']);
 */
export function claritySet(key: string, value: string | string[]): void {
  if (typeof window === 'undefined') return;
  window.clarity?.('set', key, value);
}

/**
 * clarityIdentify
 * ---------------
 * Link the Clarity session to a known user (e.g. after order placement).
 * All params are optional except userId.
 *
 * Usage:
 *   clarityIdentify(orderNumber);
 */
export function clarityIdentify(
  userId: string,
  sessionId?: string,
  pageId?: string,
  friendlyName?: string,
): void {
  if (typeof window === 'undefined') return;
  window.clarity?.('identify', userId, sessionId, pageId, friendlyName);
}

/**
 * clarityUpgrade
 * --------------
 * Force Clarity to record a session (useful at high-value moments like
 * order placement, checkout start, etc.).
 *
 * Usage:
 *   clarityUpgrade('checkout_started');
 */
export function clarityUpgrade(reason: string): void {
  if (typeof window === 'undefined') return;
  window.clarity?.('upgrade', reason);
}
