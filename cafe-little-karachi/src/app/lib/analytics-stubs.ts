// src/app/lib/analytics-stubs.ts
//
// Lossless analytics stubs and event queues for Google Analytics (gtag),
// Meta Pixel (fbq), and Microsoft Clarity.
// Installed immediately on page initialization so any early event tracking
// (e.g., initial page views, ad attribution, custom funnel stages) is
// safely buffered until scripts load on first user interaction or idle timer.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function installAnalyticsStubs(): void {
  if (typeof window === 'undefined') return;

  const w = window as any;

  // ── 1. Google Analytics (gtag / dataLayer) ─────────────────────────────────
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function () {
      w.dataLayer.push(arguments);
    };
  }

  // ── 2. Meta Pixel (fbq) ───────────────────────────────────────────────────
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
  }

  // ── 3. Microsoft Clarity ───────────────────────────────────────────────────
  if (!w.clarity) {
    w.clarity = function () {
      (w.clarity.q = w.clarity.q || []).push(arguments);
    };
  }
}
