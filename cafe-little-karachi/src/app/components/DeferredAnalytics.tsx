'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { installAnalyticsStubs } from '../lib/analytics-stubs';
import { META_PIXEL_ID, trackMetaPageView } from '../lib/metaPixel';

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-PPJHLLX7BS';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      trackMetaPageView();
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * DeferredAnalytics
 * -----------------
 * Eliminates ~668 KB of third-party script payload and ~1s of main-thread blocking time
 * on initial page load by delaying Google Analytics, Meta Pixel, and Microsoft Clarity
 * script evaluation until the first user interaction (scroll, touch, click, keydown) or
 * a 6-second idle fallback.
 *
 * Employs lossless queuing stubs (`installAnalyticsStubs()`) so events fired prior to
 * script loading (e.g., initial page views, ad attribution, custom funnel stages) are
 * buffered safely in memory and processed immediately when the scripts finish loading.
 */
export default function DeferredAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 1. Install queues immediately so early calls don't throw ReferenceError
    installAnalyticsStubs();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;

    // 2. Queue initial configurations
    if (GA_ID) {
      w.gtag('js', new Date());
      w.gtag('config', GA_ID);
    }

    if (META_PIXEL_ID) {
      w.fbq('set', 'autoConfig', false, META_PIXEL_ID);
      w.fbq('init', META_PIXEL_ID);
      w.fbq('track', 'PageView');
    }

    // 3. Setup interaction triggers & fallback timer
    const triggerLoad = () => {
      setShouldLoad(true);
      cleanup();
    };

    // 6-second fallback idle timer
    const idleTimer = window.setTimeout(triggerLoad, 6000);

    // Interaction listeners
    INTERACTION_EVENTS.forEach((event) => {
      window.addEventListener(event, triggerLoad, { once: true, passive: true });
    });

    function cleanup() {
      window.clearTimeout(idleTimer);
      INTERACTION_EVENTS.forEach((event) => {
        window.removeEventListener(event, triggerLoad);
      });
    }

    return cleanup;
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <MetaPixelRouteTracker />
      </Suspense>

      {shouldLoad && (
        <>
          {/* Google Analytics */}
          {GA_ID && (
            <Script
              id="google-analytics-script"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
          )}

          {/* Meta Pixel */}
          {META_PIXEL_ID && (
            <Script
              id="meta-pixel-script"
              src="https://connect.facebook.net/en_US/fbevents.js"
              strategy="afterInteractive"
            />
          )}

          {/* Microsoft Clarity */}
          {CLARITY_ID && (
            <Script
              id="microsoft-clarity"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                  })(window, document, "clarity", "script", "${CLARITY_ID}");
                `,
              }}
            />
          )}
        </>
      )}
    </>
  );
}
