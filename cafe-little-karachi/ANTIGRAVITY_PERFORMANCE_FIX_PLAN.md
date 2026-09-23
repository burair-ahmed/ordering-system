# PERFORMANCE_FIX_PLAN.md — littlekarachirestaurant.com

**Goal:** raise mobile Lighthouse **Performance from 22 → 90+** (stretch: local median ≥ 92, because PageSpeed Insights varies ±3–5 points between runs).
**Also fix:** 1 Accessibility failure (`button-name`).
**Must not regress:** every audit listed in [§3 Guardrails](#3-guardrails--do-not-break).

**Stack (inferred from the report):** Next.js App Router (`/_next/static/chunks/*`, `data-nimg`, `self.__next_f`), Tailwind CSS, `next/image` fronting Cloudinary (`res.cloudinary.com/dubg6octv`), Google Analytics (`G-PPJHLLX7BS`), Meta Pixel (`1619761243277122`), Microsoft Clarity. It is a menu/ordering page with category sections (Sharing Platters, Meal Boxes, Fast Food Deals, …), a header, a category nav and a cart.

> Confirm the real stack, `next` version and file layout first (`package.json`, `next.config.*`, `app/`, `middleware.ts`/`proxy.ts`). Everything below marked *(hypothesis)* must be verified in code before you change anything.

---

## 0. How to work (instructions for the agent)

1. Read this whole file before editing anything.
2. Produce a short implementation plan first, then work **phase by phase** (§5–§11). One commit per phase, message prefixed `perf:` / `a11y:`.
3. **Stop and ask the developer for confirmation** after Phase 1 (CLS/server-rendering), Phase 3 (analytics deferral) and before any change to `next.config.*`, CSP/security headers, or `middleware`.
4. Make minimal, surgical changes. No unrelated refactors, no dependency upgrades unless a phase says so.
5. Test against a **production build** (`next build && next start`). Never trust dev-mode numbers.
6. After every phase run the measurement loop in §4 and record before/after numbers.

---

## 1. Diagnosis — what the report is really saying

| # | Finding | Evidence | Probable root cause |
|---|---|---|---|
| 1 | **CLS 1.135** (max "good" is 0.1) | 5 shifts; `#category-sharing-platters` shifts 3× (0.32, 0.32, 0.25); root wrapper `div.bg-white.text-black.min-h-screen.pb-20` shifts 0.17 | Content above/inside the first category changes size several times during load: client-rendered menu/data, banners or open-now/cart UI that appear after hydration, font swap, skeleton → real content size mismatch *(hypothesis)* |
| 2 | **LCP 10.3 s**, LCP discovery + breakdown failing | Main HTML is only **8 KB**; all card images are `loading="lazy"`; 24 images / 1.4 MB loaded | The LCP element is probably a menu/hero image that is lazy-loaded or only appears after JS renders the menu, so it is discovered late and loaded slowly *(hypothesis — verify §4)* |
| 3 | **JS eval 4.5 s**, TBT 630 ms, TTI 11.2 s | One chunk (`4bab3a2492ce1c83.js`) = **3.2 s script evaluation** for only ~67 KB; `792a40256db74226.js` = 0.9 s; the document itself = 0.67 s | The 3.2 s chunk is very likely `react-dom`; time is attributed to it because it runs **hydration/rendering of a huge client tree** (whole menu is a client component). 2,784 main-thread tasks, 12 long tasks |
| 4 | **Third-party JS 668 KB, 16 requests** | gtag 172 KB, Meta Pixel 112 KB + 135 KB config, Clarity 25 KB; ~1 s of CPU combined | All analytics load eagerly at startup |
| 5 | **Images 1,425 KB / 24 requests**; 899 KiB savings | Cards are rendered 450×160 (`h-40`) but each is ~70–100 KB; served through `/_next/image` from Cloudinary | Over-large sources/quality, `sizes` too generous, too many images requested up-front |
| 6 | **Render-blocking CSS** | `a9af4a8837728bb8.css` (22 KB, 84 % unused) blocks render ~800 ms | Standard Next CSS `<link>`; not inlined |
| 7 | **Forced reflow** | insight failing | JS reads `offsetWidth`/`getBoundingClientRect`/`scrollTop` right after DOM writes — likely category-nav scroll-spy or "scroll to active tab" code *(hypothesis)* |
| 8 | Legacy JS 26 KiB | 14 KB in the first-party chunk | Old `browserslist`/transpile targets or a legacy dependency |
| 9 | Unused JS 227 KiB | `2c8a8fe95a2027a2.js` is 80 % unused (47 KB); rest is third-party | Modals/drawers/libs bundled into the initial route |
| 10 | 4 font files = 282 KB | Font requests | Too many weights/families/glyph sets; may also contribute to CLS |
| 11 | 26 "Other" requests | 30 KB | Possibly `?_rsc=` prefetch requests from many `<Link>`s *(verify)* |
| 12 | A11y: header `button.group` has no accessible name | `button-name` | Icon-only button (cart/menu/search) without text |

---

## 2. Score math & per-metric targets

Lighthouse mobile weights: FCP 10 %, Speed Index 10 %, **LCP 25 %**, **TBT 30 %**, **CLS 25 %**. The score is 0.90 exactly at each metric's "p10" value.

| Metric | Now | Score now | Weight | Needed for ≥ 0.9 | **Target (with margin)** |
|---|---|---|---|---|---|
| CLS | 1.135 | 1 | 25 % | ≤ 0.10 | **≤ 0.05** |
| LCP | 10.3 s | 0 | 25 % | ≤ 2.5 s | **≤ 2.2 s** |
| TBT | 630 ms | 47 | 30 % | ≤ 200 ms | **≤ 150 ms** |
| FCP | 2.9 s | 52 | 10 % | ≤ 1.8 s | **≤ 1.5 s** |
| Speed Index | 7.8 s | 23 | 10 % | ≤ 3.4 s | **≤ 3.0 s** |

**Impact order (do in this order):** CLS → LCP → TBT (hydration + third parties) → FCP/SI (CSS, fonts). Reaching 90 requires **all three** of CLS, LCP and TBT to be near-green — fixing only images will not be enough.

Budgets to hold: initial JS ≤ 300 KB transferred, third-party JS on load ≈ 0 KB, images on initial load ≤ 400 KB and ≤ 8 requests, fonts ≤ 2 files / ≤ 100 KB.

---

## 3. Guardrails — do not break

These audits pass today. Specific risks from this plan:

| Passing audit(s) | Rule for this work |
|---|---|
| `unsized-images`, `image-aspect-ratio`, `image-size-responsive` | Keep explicit `width`/`height` on every image and `object-cover`. Do not serve images far larger than displayed. |
| `font-display-insight` | Keep `display: swap` (or `optional`) on all fonts. |
| `valid-source-maps` | **Keep `productionBrowserSourceMaps` / source maps enabled.** |
| `csp-xss`, `trusted-types-xss`, `has-hsts`, `origin-isolation`, `clickjacking-mitigation`, `errors-in-console`, `inspector-issues` | The site has a **strict CSP + Trusted Types**. Inspect where it is set (`next.config` headers, `middleware`/`proxy`). Any new inline script/style, dynamically inserted `<script>`, or `experimental.inlineCss` must comply (nonce/hash/policy). After each change, load the page and confirm **zero** console/CSP/Trusted Types errors. Do not weaken the CSP. |
| `server-response-time`, `document-latency-insight`, `redirects` | If you move data fetching to the server, it **must be cached** (static generation / ISR `revalidate` / `"use cache"`). Do not add uncached network calls to the request path. |
| `dom-size-insight`, `duplicated-javascript-insight`, `long-tasks`, `non-composited-animations` | Don't bloat the DOM; don't add a second copy of a library; skeleton animations must use only `opacity`/`transform` (e.g. `animate-pulse`). |
| `color-contrast`, `heading-order`, `landmark-one-main`, `target-size`, `aria-*`, `label-content-name-mismatch`, `link-name` | New UI (skeletons, labels) must keep contrast, heading order and ≥ 24 px targets. Accessible names must **contain** any visible label text. |
| `crawlable-anchors`, `link-text`, `meta-description`, `is-crawlable`, `robots-txt`, `hreflang` | Keep category nav items as real `<a href="#category-…">`. Don't remove metadata. Server-rendering the menu is *good* for SEO — keep the text in the HTML. |
| `third-party-cookies`, `baseline`, `deprecations` | No new third-party cookies/deprecated APIs. |

---

## 4. Phase 0 — Baseline & measurement (do first)

```bash
# 1) production build
npm run build && npm run start   # http://localhost:3000

# 2) baseline, 5 runs, take the MEDIAN (default Lighthouse = mobile, slow-4G, 4x CPU, same as PSI)
mkdir -p .lh
for i in 1 2 3 4 5; do
  npx lighthouse http://localhost:3000 \
    --only-categories=performance,accessibility \
    --form-factor=mobile --output=json --output-path=./.lh/base-$i.json \
    --chrome-flags="--headless=new --no-sandbox" --quiet
done

# 3) find the LCP element and the layout-shift culprits
jq '.audits["largest-contentful-paint-element"].details.items' .lh/base-1.json
jq '.audits["layout-shifts"].details.items'                    .lh/base-1.json
jq '.audits["cls-culprits-insight"].details'                   .lh/base-1.json
jq '.audits["lcp-breakdown-insight"].details'                  .lh/base-1.json
```

Then answer these questions in your plan (they decide the exact fix in later phases):

1. **What is the LCP element** (image or text)? Is it `loading="lazy"`? Is it in the raw HTML?
2. **Is the menu in the initial HTML?** `curl -s http://localhost:3000 | grep -c "Dhamaka Platter"` — if `0`, the menu is client-rendered and this is the #1 root cause.
3. **What is `4bab3a2492ce1c83.js`?** Run the bundle analyzer (`next experimental-analyze` on Turbopack/Next 16, or `@next/bundle-analyzer` on webpack) and/or profile in Chrome DevTools (Performance, 4× CPU) using source maps. Which components dominate hydration?
4. Which elements shift, and what changes above them (nav chips, banner, open-now badge, cart bar, font swap)?
5. Which `next` version is installed? (`priority` vs `preload` prop, `images.qualities`, `inlineCss` availability all depend on it.)

Record the baseline table (FCP, LCP, TBT, CLS, SI, score) in the PR description.

---

## 5. Phase 1 — Kill the layout shift (CLS 1.135 → ≤ 0.05) **[highest impact]**

**Target audits:** `cumulative-layout-shift`, `layout-shifts`, `cls-culprits-insight`.

1. **Server-render the menu.** The category sections and cards (name, description, price, image) must be in the initial HTML.
   - Make `app/page.tsx` (and the menu list/card components) **Server Components**. Remove `'use client'` from anything that doesn't need state/effects/handlers.
   - If menu data is fetched in `useEffect`/SWR/React Query on the client, move the fetch to the server with caching (`export const revalidate = 300` or `fetch(..., { next: { revalidate: 300 } })`). See guardrail on TTFB.
   - Keep only truly interactive bits as small client "islands": add-to-cart button/quantity stepper, cart drawer, category nav scroll-spy.
2. **Reserve space for anything that appears after hydration.** For each element found in Phase 0 Q4:
   - Announcement/promo strips, open/closed badge (time-dependent!), delivery info, cart summary: render the same markup on server and client, or reserve a fixed `min-h-*`/`aspect-*` box. Do **not** compute time-dependent UI during render in a way that differs from the server (hydration mismatch → re-layout).
   - Cart state restored from `localStorage`: apply it after first paint and only inside fixed-size elements (badge inside a fixed-size button, `position: fixed` bar). It must not push content.
3. **Skeletons must match final size.** If a section shows a skeleton, it needs the same height as real content (or use `min-height`).
4. **Fonts:** use `next/font` (with `subsets: ['latin']`, `display: 'swap'`) so fallback metrics are size-adjusted automatically. Remove any `@font-face`/`<link>` Google Fonts usage that bypasses it.
5. **Never insert content above existing content** after load (toasts/banners → `position: fixed/absolute`, not in flow).
6. Category nav (chips row): give it a fixed height; render it on the server.

**Acceptance:** local Lighthouse CLS ≤ 0.05; `layout-shifts` audit shows no shift ≥ 0.02. Also verify in DevTools → Performance → "Layout Shifts" track with 4× CPU + Fast 4G.

---

## 6. Phase 2 — LCP & images (LCP 10.3 s → ≤ 2.2 s; images 1.4 MB → ≤ 400 KB)

**Target audits:** `largest-contentful-paint`, `lcp-discovery-insight`, `lcp-breakdown-insight`, `image-delivery-insight`.

### 6.1 Make the LCP image discoverable and high priority
- For the LCP image (and the 1–2 cards visible in the first mobile viewport): **remove lazy loading**, add `fetchPriority="high"` and mark for preload — `preload` prop on Next 16+, `priority` on Next ≤ 15.
- Everything below the fold stays lazy.
- If the LCP element is **text**, the fix is Phase 1 (server-render) + Phase 5 (CSS/fonts), not images.
- Make sure the image URL is present in the server HTML (not injected by client JS).

### 6.2 Shrink images (target ≈ 15–30 KB per card instead of 70–100 KB)
Cards render at 450×160 (`h-40`, `object-cover`) but are served through `/_next/image` at oversized widths and default quality.

**Preferred (Option A): serve straight from Cloudinary with a custom loader**, removing the extra server hop:

```ts
// lib/cloudinary-loader.ts
import type { ImageLoaderProps } from 'next/image';

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith('https://res.cloudinary.com/')) return src; // pass through anything else
  const t = [
    'f_auto',                       // AVIF/WebP automatically
    `q_${quality ?? 'auto:eco'}`,
    'c_fill', 'g_auto', 'ar_450:160', // match the card's 450x160 ratio
    `w_${width}`,
    'dpr_1.0',
  ].join(',');
  return src.replace('/image/upload/', `/image/upload/${t}/`);
}
```
```ts
// next.config.* (MERGE, do not overwrite)
images: { loader: 'custom', loaderFile: './lib/cloudinary-loader.ts' },
```
Then visually compare a few cards before/after (`g_auto` focal point vs. CSS centre crop) — keep the look unchanged.

**Fallback (Option B), if the custom loader isn't acceptable:** keep `/_next/image` but set `formats: ['image/avif','image/webp']`, `quality={55}` on card images (on Next 16 also list it in `images.qualities`), reduce `deviceSizes`, and raise `minimumCacheTTL`.

### 6.3 Correct `sizes`
On mobile the card is ~one column wide. Use something like
`sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"` (adjust to the real layout) so the browser doesn't pick a 750–1080 px source for a 160 px-tall crop.

### 6.4 Request fewer images up-front
24 image requests is far more than the first viewport needs; this is probably a knock-on effect of the layout shifts (short layout → all lazy images look "in view"). After Phase 1, recheck. If still > 8 images on load, defer below-the-fold categories (see 8.3).

**Acceptance:** LCP ≤ 2.2 s; `lcp-discovery-insight` passes; image bytes on load ≤ 400 KB; `image-delivery-insight` savings < 100 KB.

---

## 7. Phase 3 — Third-party scripts (−668 KB, ~1 s of main-thread time)

**Target audits:** `bootup-time`, `mainthread-work-breakdown`, `unused-javascript`, `cache-insight`, `network-dependency-tree-insight`, `total-blocking-time`, `interactive`.

Google Analytics, Meta Pixel and Clarity currently run during page load. Change them to load **after the first user interaction** (with a long idle fallback), while keeping queued events so nothing is lost.

> **Trade-off to tell the developer:** visitors who neither scroll, tap nor stay ≥ ~12 s won't be counted by these tools. This is standard practice but is a real analytics trade-off. If the owner rejects it, use `strategy="lazyOnload"` and expect a lower score (≈ 75–85).

**Reuse the existing IDs and the existing Clarity snippet/project ID; don't invent new ones. Load scripts the same way the site does today (respect CSP nonce / Trusted Types).**

```ts
// lib/analytics-stubs.ts — tiny queue stubs so early events aren't lost
/* eslint-disable @typescript-eslint/no-explicit-any */
export function installAnalyticsStubs() {
  const w = window as any;

  // GA / gtag
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };

  // Meta Pixel (same queue shape as the official snippet)
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  }
}
```
```tsx
// components/DeferredAnalytics.tsx
'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { installAnalyticsStubs } from '@/lib/analytics-stubs';

const GA_ID = 'G-PPJHLLX7BS';
const FB_PIXEL_ID = '1619761243277122';
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

export default function DeferredAnalytics() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    installAnalyticsStubs();
    const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    w.gtag('js', new Date());
    w.gtag('config', GA_ID);
    w.fbq('init', FB_PIXEL_ID);
    w.fbq('track', 'PageView');

    const trigger = () => { setLoad(true); cleanup(); };
    const timer = window.setTimeout(trigger, 12000); // idle fallback; keep >= 10s
    EVENTS.forEach((e) => window.addEventListener(e, trigger, { once: true, passive: true }));
    function cleanup() {
      window.clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, trigger));
    }
    return cleanup;
  }, []);

  if (!load) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
      {/* Clarity: move the EXISTING snippet here so it also starts on the same trigger */}
    </>
  );
}
```

Steps:
1. Find where GA, Meta Pixel and Clarity are currently injected (`layout.tsx`, `<Script>`, `@next/third-parties`, GTM). Remove the eager loading and mount `<DeferredAnalytics />` once in the root layout.
2. Any existing `gtag(...)` / `fbq('track', …)` calls in cart/checkout code must keep working — thanks to the stubs, they queue until the scripts load.
3. Check `gtag('config', …)` calls: if there are extra product/Ads IDs that are no longer used, remove them (the 172 KB gtag file is large partly because of these).
4. Add no `preconnect` for these origins (they're now off the critical path).
5. Verify in DevTools → Network that, before any interaction, there are **no** requests to `googletagmanager.com`, `facebook.net`, `clarity.ms`; after a tap/scroll they load, and GA/Pixel receive the queued `PageView`.

**Acceptance:** third-party requests on load = 0; `bootup-time` < 2.0 s; TBT drops by ≥ 200 ms.

---

## 8. Phase 4 — First-party JavaScript, hydration, forced reflow (TBT ≤ 150 ms)

**Target audits:** `bootup-time`, `mainthread-work-breakdown`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `legacy-javascript-insight`, `forced-reflow-insight`.

### 8.1 Shrink the client tree (the 3.2 s hydration cost)
- Server Components by default (see Phase 1). Push `'use client'` to the leaves.
- Static menu markup should not be re-rendered on the client. A single `AddToCart` island per card is fine; make sure it reads cart state through a **selector** (Zustand/Context selectors) so adding one item doesn't re-render the whole menu.
- Avoid `useEffect(() => setState(...))` cascades on mount (each triggers a full re-render). Derive values during render or compute on the server.
- Wrap non-urgent state updates in `startTransition`; break long loops with `await scheduler.yield?.()` where available.

### 8.2 Lazy-load what isn't needed on first paint
- `next/dynamic` for: cart drawer, checkout modal, item-detail modal, toasts, maps, carousels, date/time pickers. Use `ssr: false` only for purely client-side, non-SEO UI.
- Target: `2c8a8fe95a2027a2.js` (59 KB, 80 % unused) is no longer in the initial route. Identify it with the analyzer.
- If `framer-motion` (or similar) is used, switch to `LazyMotion` + `domAnimation` or plain CSS transitions.
- Add `experimental.optimizePackageImports` for icon/UI libs (e.g. `lucide-react`, `react-icons`) if not already covered.

### 8.3 Reduce style/layout/render cost (602 ms + 303 ms)
- Optional, only if TBT/SI targets are still missed: give below-the-fold category sections `content-visibility: auto; contain-intrinsic-size: auto <realistic height>px;` (measure real section heights; use a realistic estimate so it doesn't introduce new shifts; verify anchor jumps from the category nav still land correctly; don't apply to the first 2 categories).

### 8.4 Forced reflow
- Locate code that reads `offsetWidth/offsetHeight/getBoundingClientRect/scrollTop/clientHeight` right after DOM/class writes (grep for those; start with the category nav / scroll-spy / "scroll active chip into view").
- Replace scroll-spy with **IntersectionObserver** (`rootMargin` accounting for the sticky header, cf. `scroll-mt-24`). Batch reads, then writes (`requestAnimationFrame`). Never measure inside scroll handlers without throttling.

### 8.5 Legacy JavaScript (−26 KiB)
- Add/adjust `browserslist` in `package.json` to modern targets, e.g. `"browserslist": ["chrome >= 111", "edge >= 111", "firefox >= 111", "safari >= 16.4"]`. Remove manual polyfills (`core-js`, `regenerator-runtime`, `whatwg-fetch`) and check dependencies that ship ES5.
- The other 12 KB is inside Meta's `fbevents.js` and is not fixable in code.

### 8.6 Prefetch noise (verify first)
- If DevTools shows many `?_rsc=` requests (the "Other: 26 requests"), set `prefetch={false}` on repeated `<Link>`s inside the menu.

**Acceptance:** TBT ≤ 150 ms, TTI < 4 s, no task > 100 ms during load, `forced-reflow-insight` passes.

---

## 9. Phase 5 — CSS, fonts, render-blocking (FCP ≤ 1.5 s, SI ≤ 3.0 s)

**Target audits:** `render-blocking-insight`, `unused-css-rules`, `first-contentful-paint`, `speed-index`, font weight.

1. **Inline critical CSS** so the 22 KB stylesheet stops blocking render: enable `experimental: { inlineCss: true }` in `next.config.*` if the installed Next version supports it (check the option name in the docs for your version). Confirm the CSP allows inline styles (`style-src`), and measure — keep it only if FCP improves.
2. Tailwind: confirm `content` globs (v3) / automatic detection (v4) don't scan unnecessary folders; delete unused component CSS and any globally imported third-party stylesheets (`swiper/css`, `react-toastify/dist/ReactToastify.css`, …) — import them only in the components that need them.
3. **Fonts (282 KB, 4 files):** identify each file. Keep ≤ 2 files — one variable font or 2 weights, `latin` subset only; drop unused weights/italics; remove icon fonts in favour of inline SVG. Keep `display: swap`. Only the fonts used above the fold should be preloaded.
4. Don't add a `preconnect` to `res.cloudinary.com` unless you used Option A in Phase 2 *and* the LCP image is on that origin (then one `preconnect` is worthwhile).

---

## 10. Phase 6 — Accessibility (`button-name`)

Offender: `header.w-full > div.w-full > div.flex > button.group` (`class="group relative flex items-center h-10 md:h-12 px-2 md:pl-5 md:pr-2 …" tabindex="0"`). Likely the cart/menu/search icon button.

- Find it in the header component and determine its purpose.
- Give it an accessible name via visually hidden text (preferred, so it also satisfies `label-content-name-mismatch` if a label is visible at `md:`):
  ```tsx
  <button type="button" className="group relative …">
    <CartIcon aria-hidden="true" focusable="false" />
    <span className="sr-only">Open cart</span>   {/* match the real purpose */}
    {/* any badge/count stays visible */}
  </button>
  ```
- Remove the redundant `tabindex="0"`. Ensure the icon `<svg>` has `aria-hidden="true"`.
- Keep the touch target ≥ 24×24 px (`target-size` currently passes).

**Acceptance:** Accessibility ≥ 98, `button-name` passes, no new a11y failures.

---

## 11. Phase 7 — Verify and iterate

1. Re-run the §4 loop (5 runs, median) on the production build. Compare with baseline.
2. If Performance < 90, look at the lowest-scoring metric and repeat the relevant phase. Typical order of remaining gaps: TBT (client tree, third parties) → LCP (image discovery) → CLS (a missed shifting element).
3. Confirm all guardrails in §3: run the full Lighthouse (all four categories) and compare the audit list against "Currently passing" in the original `CLAUDE.md`. Check the browser console for CSP/Trusted Types/hydration errors.
4. Manually test: add to cart, open the cart drawer, checkout flow, category nav jumps, and confirm GA/Meta Pixel/Clarity events fire after the first interaction.
5. After deploy, run PageSpeed Insights (mobile) 3 times on `https://www.littlekarachirestaurant.com/`.

---

## 12. Owner actions (not code — pass these to the site owner)

- **Meta Events Manager:** turn off *Automatic Advanced Matching* and *Automatic event detection* if not needed — this shrinks the 135 KB `signals/config` script. Consider Conversions API (server-side) long-term instead of the browser pixel.
- **Google Analytics:** remove unused linked products/extra data streams that inflate `gtag.js`.
- **Cloudinary:** upload new menu photos at ≤ 1200 px wide; enable `f_auto,q_auto` defaults on the account.
- **Hosting/CDN:** make sure static assets (`/_next/static/*`) keep `Cache-Control: public, max-age=31536000, immutable` and Brotli is on. (The `cache-insight` offenders are all third-party and disappear with Phase 3.)

---

## 13. Definition of done

- [ ] Local median (5 runs, production build, mobile) **Performance ≥ 90** (aim ≥ 92); PSI mobile ≥ 90 on 2 of 3 runs after deploy
- [ ] CLS ≤ 0.05 · LCP ≤ 2.2 s · TBT ≤ 150 ms · FCP ≤ 1.5 s · SI ≤ 3.0 s
- [ ] Accessibility ≥ 98 (`button-name` fixed); Best Practices = 100; SEO = 100
- [ ] No audit from the "Currently passing" list regressed; no console/CSP/Trusted Types errors
- [ ] Analytics still fire (after first interaction), cart and checkout work

### Report back to the developer (short table)

| Metric | Before | After | Phase that moved it |
|---|---|---|---|
| Performance score | 22 | | |
| FCP / LCP / TBT / CLS / SI | 2.9 s / 10.3 s / 630 ms / 1.135 / 7.8 s | | |
| JS transferred / images transferred / requests | 756 KB / 1,425 KB / 78 | | |

Include: root causes actually found (vs. the hypotheses above), files changed per phase, anything skipped and why, and any trade-off that needs the owner's decision.

---

## Appendix — every failing audit → where it's fixed

| Audit | Phase |
|---|---|
| `cumulative-layout-shift`, `layout-shifts`, `cls-culprits-insight` | 1 |
| `largest-contentful-paint`, `lcp-discovery-insight`, `lcp-breakdown-insight` | 2 (+1) |
| `image-delivery-insight` | 2 |
| `bootup-time`, `mainthread-work-breakdown`, `total-blocking-time`, `max-potential-fid`, `interactive` | 3, 4 |
| `unused-javascript` | 3, 4 |
| `cache-insight` (all third-party) | 3 |
| `network-dependency-tree-insight` | 3, 5 |
| `legacy-javascript-insight` | 4.5 |
| `forced-reflow-insight` | 4.4 |
| `render-blocking-insight`, `unused-css-rules` | 5 |
| `first-contentful-paint`, `speed-index` | 1, 2, 5 |
| `button-name` (Accessibility) | 6 |
