---
title: "Living Project Memory & Task Tracker — Advanced Ordering Ecosystem"
tags:
  - #type/memory
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-24
---

## 0. Phase 2 Perf Fix — CLK LCP & Image Delivery Optimization (2026-09-24)

### Optimizing Largest Contentful Paint (10.3s → ≤ 2.2s) & Image Payload Delivery
- **Files**:
  - `cafe-little-karachi/next.config.ts` (UPDATED)
  - `cafe-little-karachi/src/app/components/MenuItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/PlatterItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/BannerSlider.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/order/page.tsx` (UPDATED)
- **Context & Goal**: Large images and misconfigured priority preloads were choking bandwidth on mobile devices. Every menu item and platter card rendered a hidden modal with `priority`, creating dozens of simultaneous image preloads on initial load, while cards rendered at full-width source sizes (`100vw`) and unoptimized formats.
- **Changes Applied**:
  - **`next.config.ts`**: Enabled modern image formats `['image/avif', 'image/webp']`, configured 1-year cache TTL (`minimumCacheTTL: 31536000`), and optimized `deviceSizes` (`[360, 480, 640, 750, 828, 1080, 1200, 1920]`) and `imageSizes` (`[64, 96, 128, 160, 256, 384]`).
  - **`MenuItem.tsx` & `PlatterItem.tsx`**:
    - Removed `priority` from modal images — modal images now load on-demand with `loading="lazy"` when opened, freeing critical initial network bandwidth for the LCP hero image.
    - Updated card image responsive `sizes` from `100vw` to `(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 25vw` matching actual 2-column mobile and 4-column desktop grid layouts.
    - Removed `unoptimized={true}` on list card images so Next.js AVIF/WebP compression is applied.
  - **`BannerSlider.tsx`**: Set `fetchPriority="high"` and `loading="eager"` exclusively on the initial slide (`idx === 0`), keeping secondary slides lazy.
  - **`order/page.tsx`**: Removed `unoptimized={true}` and added responsive `sizes` to `ChefStoryRow`.
- **Rationale**: Prioritizing exclusively the first visible viewport image while eliminating background modal preloads ensures fast, unblocked LCP discovery and minimal total image payload.

---

## 0. Phase 1 Perf Fix — CLK CLS Elimination & Server-Side Menu Rendering (2026-09-24)

### Killing Cumulative Layout Shift (1.135 → ≤ 0.05) & Server-Rendering the Menu Catalog
- **Files**:
  - `cafe-little-karachi/src/lib/serverMenuData.ts` (NEW)
  - `cafe-little-karachi/src/app/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/item/[slug]/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/platter/[slug]/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/order/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/CategoryNavStrip.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/Header.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/BannerSlider.tsx` (UPDATED)
- **Context & Goal**: Lighthouse mobile score was degraded due to a severe CLS score of 1.135 caused by: (1) client-rendered menu with artificial `Math.random()` setTimeout staggered item injection, (2) Header returning `null` during SSR (`if (!isClient) return null`), (3) BannerSlider returning `null` during SSR, and (4) CategoryNavStrip using `getBoundingClientRect()` in window scroll handler causing forced reflow.
- **Changes Applied**:
  - **`serverMenuData.ts`**: Created high-performance server-side data fetcher (`getServerMenuData()`) that connects to MongoDB and queries `PageConfig`, `Platter`, and initial `MenuItem`s by section with `.lean()`, sanitizing MongoDB IDs to plain JSON.
  - **`page.tsx`, `item/[slug]/page.tsx`, `platter/[slug]/page.tsx`**: Migrated to Server Components with 5-minute ISR cache (`export const revalidate = 300`). Fetches `getServerMenuData()` on the server and passes `initialData` to `<MenuPage />`.
  - **`order/page.tsx`**: 
    - Initialized state directly from `initialData` (`sections`, `allPlatters`, `sectionLoadedItems`, `classicLoadedItems`, `classicLoadedPlatters`).
    - Set `pageLoading = false` on initial render so the full DOM is present in the initial server HTML.
    - Removed `loadItemsProgressively` and `addClassicItemWithAnimation` with random `setTimeout` staggered animations that previously pushed elements downward post-hydration.
    - Retained full client interactivity (infinite scroll, category jump anchors, modal opens, cart actions).
  - **`CategoryNavStrip.tsx`**: Replaced window scroll listener and `getBoundingClientRect()` loop with `IntersectionObserver` (`rootMargin: '-85px 0px -50% 0px'`). Eliminates forced reflows during category browsing.
  - **`Header.tsx`**: Removed `isClient` state and `if (!isClient) return null` so the header is pre-rendered in SSR HTML. Added accessible `aria-label` to Cart button.
  - **`BannerSlider.tsx`**: Changed SSR guard to `if (!count) return null` so the initial slide and aspect-ratio box are rendered on the server without blank layout shift.
- **Rationale**: Server-rendering the menu and header guarantees that the browser receives a fully-formed layout immediately upon arrival. Images and container heights are reserved upfront, eliminating layout shifts and delivering an instantaneous, frictionless customer experience.

---

## 0. Phase 4.43 Micro-Change — CLK Direct Link Frictionless Add-to-Cart & Deferred Checkout Location Selection (2026-09-23)

### Direct Product Link Ad Campaign UX Optimization
- **Files**:
  - `cafe-little-karachi/src/app/context/OrderContext.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/layout.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/MenuItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/PlatterItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/checkout/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/platter/[slug]/page.tsx` (UPDATED)
- **Context & Goal**: Customers arriving via Facebook/Instagram/TikTok ad direct product links (`/item/[slug]`, `/platter/[slug]`) were abandoning immediately because clicking "Add to Cart" triggered the "Select Order Mode" popup before they had a chance to explore the menu. Goal: suppress the popup during browsing; defer it to checkout only.
- **Changes Applied**:
  - **`OrderContext.tsx`**: Added `isDirectLinkCustomer` boolean state. On mount, detects if the entry path is `/item/*` or `/platter/*` (or `sessionStorage.clk_direct_product_entry === 'true'`). When `isDirectEntry` is true, keeps `isLocationModalOpen: false` instead of auto-opening. Exposes `isDirectLinkCustomer` in context value.
  - **`layout.tsx`**: Mounted `<TableForm />` globally inside `<OrderProvider>` (inside `<CartProvider>`). This ensures the single modal instance is available on all routes including `/checkout`, `/item/*`, `/platter/*` without per-route duplicates.
  - **`MenuItem.tsx`**: Removed `isLocationSet` and `setLocationModalOpen` from `useOrder()` destructure. `handleAddRequest` and `closeModal` no longer call `setLocationModalOpen(true)` — items are added instantly without popup interruption.
  - **`PlatterItem.tsx`**: Same cleanup — removed `isLocationSet` and `setLocationModalOpen`. `handleAddRequest` adds to cart immediately via `performCartAdd()` without location check.
  - **`checkout/page.tsx`**:
    - Added `isLocationSet` and `setLocationModalOpen` to `useOrder()` destructure.
    - Added `useEffect` on mount: if `!isLocationSet`, triggers `setLocationModalOpen(true)` after 300 ms delay for smooth UX.
    - Added **Order Mode Switcher card** at the top of the form section: shows current mode icon + label + "Change" button when location is set; shows amber pulsing "Select Your Order Mode" CTA when not set.
    - Added `!isLocationSet` guard at the top of `handleCheckout` — opens modal and blocks submission if mode not selected.
  - **`platter/[slug]/page.tsx`**: Removed duplicate `<TableForm />` import and render (now handled globally in `layout.tsx`).
- **Rationale**: Separates browsing from commitment. Direct-link ad customers are high-intent but can be easily spooked by premature friction. Deferring location to checkout ensures they first explore, fall in love with the menu, and commit — then the single focused prompt at checkout converts them.

---

## 0. Phase 4.42 Micro-Change — CLK Order Sources & Marketing Attribution (2026-09-23)

### Marketing Order Attribution, Ad Source Tracking & Microsoft Clarity Tagging
- **Files**:
  - `cafe-little-karachi/src/app/lib/orderSource.ts` (NEW)
  - `cafe-little-karachi/src/app/components/OrderSourceCapture.tsx` (NEW)
  - `cafe-little-karachi/src/app/layout.tsx` (UPDATED)
  - `cafe-little-karachi/src/models/Order.ts` (UPDATED)
  - `cafe-little-karachi/src/pages/api/orders.ts` (UPDATED)
  - `cafe-little-karachi/src/app/checkout/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/pages/api/order-source-analytics.ts` (NEW)
  - `cafe-little-karachi/src/app/components/OrderSourceAnalytics.tsx` (NEW)
  - `cafe-little-karachi/src/app/admin/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/OrdersList.tsx` (UPDATED)
- **Context & Goal**: Administrators and marketers running social media ads (Facebook Ads, Instagram Ads, TikTok, Google, etc.) needed visibility into where orders originate, which campaigns generate the highest conversion rates and revenue, and wanted Clarity session recordings segmented by ad source.
- **Changes Applied**:
  - **Attribution Capture Engine (`src/app/lib/orderSource.ts`)**: Implemented `captureOrderSource()`, `getOrderSource()`, and `resolveSourceLabel()`. Parses `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, landing path, and `document.referrer`. Saves to `sessionStorage` (`clk_order_source`) to prevent cross-session contamination. Tags Microsoft Clarity with `clarity('set', 'order_source', label)` and `clarity('set', 'campaign', name)`.
  - **Capture Client Component (`OrderSourceCapture.tsx`)**: Created `'use client'` invisible component invoking `captureOrderSource()` on mount.
  - **Root Layout (`layout.tsx`)**: Mounted `<OrderSourceCapture />` inside RootLayout alongside `ClarityProvider` and `MetaPixelProvider`.
  - **Order Model Schema (`src/models/Order.ts`)**: Added `orderSource` subdocument with `source`, `medium`, `campaign`, `content`, `term`, `referrer`, `landingPage`, `label` (defaults to `"Direct / Organic"`), and `capturedAt`.
  - **Orders API Handler (`src/pages/api/orders.ts`)**: Destructures `orderSource` from `req.body` and stores it on the newly created MongoDB order document.
  - **Checkout Submission (`checkout/page.tsx`)**: Injected `orderSource: getOrderSource()` into the `newOrder` payload sent to `/api/orders`.
  - **Analytics API (`src/pages/api/order-source-analytics.ts`)**: Implemented GET endpoint with date filtering (`today`, `7d`, `30d`, `90d`, `all`). Aggregates total orders, total revenue, average order value, paid ads vs direct/organic breakdown, active campaign metrics, daily timelines, and recent order feeds.
  - **Admin Tab Component (`OrderSourceAnalytics.tsx`)**: Created comprehensive dashboard with:
    - 4 KPI summary cards (Total Orders, Paid Ads Revenue & Share %, Organic Orders & AOV, Top Converting Channel).
    - Channel Breakdown progress bars with color-coded badges for Facebook (blue), Instagram (pink/purple), Google (amber/emerald), TikTok (cyan), WhatsApp (emerald), and Direct/Organic (slate).
    - Recharts Daily Attributed Orders timeline bar chart.
    - Active Ad Campaigns performance table.
    - Interactive Campaign UTM URL Builder tool for the marketing team.
    - Recent attributed orders feed.
  - **Admin Workspace Integration (`admin/page.tsx`)**: Added `Megaphone` icon import, updated `TabKey` union and `TABS` array with `{ key: 'orderSources', label: 'Order Sources', icon: Megaphone }`, and added the active tab render block.
  - **Live Orders Source Badges (`OrdersList.tsx`)**: Updated `Order` interface with optional `orderSource` field, and displayed source badges on order cards in Grid and Kanban views for instant recognition.

---

## 0. Phase 4.41 Micro-Change — CLK Live Orders Cancel Order Section (2026-09-23)

### Cancel Order Section & Void Management in Live Orders Tab
- **Files**:
  - `cafe-little-karachi/src/app/components/OrdersList.tsx` (UPDATED)
- **Context & Goal**: In the admin panel Live Orders tab (`OrdersList`), administrators needed the ability to cancel / void orders, filter specifically by cancelled orders, view them in dedicated sections across Grid, Kanban, and Table views, and easily restore cancelled orders back to the active Received queue if needed.
- **Changes Applied**:
  - **Status Logic & Helpers**: Added `isOrderCancelled` (matches `cancelled`, `canceled`, `rejected`), and `isOrderActive` (`!delivered && !cancelled`) to cleanly isolate the 3 order states.
  - **HUD Metric Filter Cards**: Converted top status HUD from 3 to 4 cards (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`) adding a dedicated Rose/Crimson `CANCELLED` card with `Ban` icon, live voided order counter, and status filter trigger (`statusFilter: "received" | "delivered" | "cancelled" | "all"`).
  - **Status Mutator (`setOrderStatus`)**: Updated mutation handler to support `"Received" | "Delivered" | "Cancelled"`, with error toast on cancel, success toast on deliver, and info toast on restore/revert to Received.
  - **Grid View Order Cards**:
    - Header banner renders crimson gradient (`from-rose-700 via-rose-800 to-red-900`) with `Ban` icon and `CANCELLED` label when voided.
    - Card total price rendered with line-through styling for cancelled orders.
    - Active cards feature a clean `[ ✕ Cancel Order ]` action button beneath `[ ✓ MARK AS DELIVERED ]`.
    - Delivered cards feature an inline `[ Cancel ]` button alongside `[ Undo ]`.
    - Cancelled cards feature a `[ ↺ Restore ]` action button to instantly revive the order back to the active Received queue.
  - **Kanban Board**: Upgraded from 2 columns to a 3-column stage board: `RECEIVED (Pending)`, `DELIVERED (Fulfilled)`, and `CANCELLED (Voided)` with count badges and direct action buttons.
  - **Table View List**: Formatted status badge with red styling for cancelled orders and provided contextual actions (`Deliver` / `Cancel` for active, `Undo` / `Cancel` for delivered, and `Restore` for cancelled).
  - **POS Ticket Inspector Modal**: Enhanced header with crimson theme for cancelled tickets and updated status control section with `Cancel Order` and `Restore to Received` action buttons.
  - **Receipt Downloader**: Downloaded `.txt` receipt reflects `Order Status: CANCELLED` when voided.

---

## 0. Phase 4.40 Micro-Change — CLK Live Orders Exact AM/PM Placement Time (2026-09-21)

### Exact 12-Hour AM/PM Placement Time Display in Live Orders
- **Files**:
  - `cafe-little-karachi/src/app/components/OrdersList.tsx` (UPDATED)
- **Context & Goal**: In the admin panel Live Orders tab, orders previously only displayed a relative time (e.g. `20m ago`, `1h ago`, `2h ago`), making it difficult for kitchen and dispatch managers to know the exact clock time (e.g. `08:45 PM`) when the order was placed.
- **Changes Applied**:
  - **`formatExactTime` helper**: Added helper function formatting `createdAt` ISO string into 12-hour AM/PM format (e.g. `8:45 PM`, `12:15 AM`) via `Intl.DateTimeFormat` / `toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })`.
  - **Grid View Card Header**: Displayed `formatExactTime(order.createdAt)` with `text-[11px] font-medium opacity-85 block mt-0.5` directly beneath `timeAgo(order.createdAt)` in the card status top banner.
  - **Kanban View Board**: Added exact time beneath the relative time in card headers across both Received and Delivered columns.
  - **Table View List**: Formatted the Time column with relative time (`font-bold text-xs`) and exact time (`text-[11px] font-medium text-neutral-400 mt-0.5`).
  - **POS Ticket Inspector Modal**: Enhanced header with combined relative time and exact time (e.g. `1h ago (8:45 PM)`).

---

## 0. Phase 4.39 Micro-Change — CLK robots.txt and Dynamic sitemap.xml (2026-09-21)

### Native Next.js 15 robots.txt and Dynamic Sitemap Implementation
- **Files**:
  - `cafe-little-karachi/src/app/robots.ts` (NEW)
  - `cafe-little-karachi/src/app/sitemap.ts` (NEW)
  - `cafe-little-karachi/src/app/layout.tsx` (UPDATED)
- **Context & Goal**: Implemented native Next.js 15 App Router SEO crawling rules (`/robots.txt`) and a dynamic XML sitemap (`/sitemap.xml`) for search engines, crawlers, and ad campaigns.
- **Changes Applied**:
  - **`robots.ts`**: Configured `MetadataRoute.Robots` defining crawl rules allowing `/`, disallowing private/admin/checkout surfaces (`/admin`, `/admin/`, `/api/`, `/checkout`, `/thank-you`), and linking to `${baseUrl}/sitemap.xml`.
  - **`sitemap.ts`**: Configured dynamic `MetadataRoute.Sitemap` resolving live catalog dishes (`MenuItem`) and combo platters (`Platter`) from MongoDB to generate clean campaign URLs (`/item/[slug]` & `/platter/[slug]`) with item modification timestamps, paired with core static endpoints (`/`, `/order`). Includes resilient error handling.
  - **`layout.tsx`**: Added `metadataBase: new URL(BASE_URL)` to metadata exports for standardized URL resolution across metadata, OpenGraph, and sitemaps.

---

## 0. Phase 4.38 Micro-Change — CLK PostHog Complete Removal (2026-09-21)

### PostHog Configuration & Dependency Complete Removal
- **Files**:
  - `cafe-little-karachi/src/app/providers/PostHogProvider.tsx` (DELETED)
  - `cafe-little-karachi/src/app/layout.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/thank-you/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/checkout/page.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/CartSidebar.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/MenuItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/PlatterItem.tsx` (UPDATED)
  - `cafe-little-karachi/README.md` (UPDATED)
  - `cafe-little-karachi/package.json` (UPDATED - `posthog-js` uninstalled)
- **Context & Goal**: Completely removed all PostHog tracking, providers, direct capture calls, user identity resets/identification, and dependencies from Cafe Little Karachi (CLK).
- **Changes Applied**:
  - **Provider & Layout**: Deleted `src/app/providers/PostHogProvider.tsx` and removed `CSPostHogProvider` wrapping from `src/app/layout.tsx`.
  - **Funnel & Component Tracking**: Removed `posthog.capture` calls and `posthog` imports from `thank-you/page.tsx`, `checkout/page.tsx`, `CartSidebar.tsx`, `MenuItem.tsx`, and `PlatterItem.tsx`. All analytics event tracking remains reliably handled by `trackEvent` (Google Analytics, Clarity, Meta Pixel).
  - **Package & Dependency**: Uninstalled `posthog-js` from `cafe-little-karachi/package.json`.
  - **Documentation**: Updated `cafe-little-karachi/README.md` to reflect Google Analytics, Microsoft Clarity, and Meta Pixel analytics stack.

---

## 0. Phase 4.37 Micro-Change — CLK Hero LCP Fix: Replace raw `<img>` / CSS `background-image` with `next/image` (2026-09-21)

### Hero LCP Performance Fix
- **Files**:
  - `cafe-little-karachi/src/app/components/Hero.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/order/page.tsx` — `HeroSection` component (UPDATED)
- **Context & Goal**: The audit report (`clk_web_quality_audit.md`) identified that all hero render branches used either raw `<img>` tags or CSS `background-image` on `<div>` elements. Neither is discoverable by the browser preload scanner, causing estimated LCP of 3–5 s on mobile.
- **Root Cause**: 4 raw `<img>` occurrences in freesize branches and 4 CSS `style={{ backgroundImage: ... }}` divs in sized/overlay branches across both `Hero.tsx` and `HeroSection` in `order/page.tsx`.
- **Changes Applied**:
  - Added `import Image from 'next/image'` to `Hero.tsx` (was missing entirely).
  - **Freesize branches** (`bannerSize === 'freesize'`): replaced raw `<img src=...>` with `<Image width={0} height={0} sizes="100vw" priority className="w-full h-auto">` — enables natural intrinsic sizing while being preloaded.
  - **Sized/overlay branches**: replaced CSS `<div style={{ backgroundImage: ... }}>` with `<Image fill priority sizes="100vw" className="object-cover">` — `fill` positions the image absolutely within the relative container (same visual result), `priority` injects `fetchpriority="high"` and a `<link rel="preload">` tag.
  - Added `z-[5]` to overlay div in the main overlay return path of `Hero.tsx` and `HeroSection` to maintain correct stacking after removing background divs.
  - `Image` was already imported in `order/page.tsx` (line 16) — no import change needed there.
- **Expected Impact**: Browser preload scanner can now discover `/bg-hero.webp` immediately; LCP should drop from ~3–5 s to well under 2.5 s (LCP target). Also eliminates all `next/image` lint warnings for unoptimized images.

---


### Website Title & Favicon Synchronization
- **Files**:
  - `cafe-little-karachi/src/app/layout.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/favicon.ico` (UPDATED)
- **Context & Goal**: Updated the storefront brand title to "Little Karachi Express" and synchronized the browser tab favicon to use the high-definition brand icon (`hd-logo.ico`).
- **Changes Applied**:
  - Updated `metadata.title` to `"Little Karachi Express"` and added `metadata.icons` pointing to `icon: "/hd-logo.ico"`, `shortcut: "/hd-logo.ico"`, `apple: "/hd-logo.ico"` in `src/app/layout.tsx`.
  - Replaced `src/app/favicon.ico` with `public/hd-logo.ico` to ensure Next.js App Router root favicon requests serve the exact HD logo.

---

## 0. Phase 4.35 Micro-Change — Cafe Little Karachi Launch Brag Video Creation (2026-09-18)

### Launch Video Production via Brag Skill & Hyperframes
- **Files**:
  - `cafe-little-karachi/brag-output-2026-09-18-175800/brag-plan.md` (NEW)
  - `cafe-little-karachi/brag-output-2026-09-18-175800/composition-brief.md` (NEW)
  - `cafe-little-karachi/brag-output-2026-09-18-175800/composition/index.html` (NEW)
  - `cafe-little-karachi/brag-output-2026-09-18-175800/share-copy.txt` (NEW)
  - `cafe-little-karachi/brag-output-2026-09-18-175800/brag.jpg` (NEW)
  - `cafe-little-karachi/brag-output-2026-09-18-175800/brag.mp4` (NEW)
- **Context & Objectives**: Generated a launch video showcasing Cafe Little Karachi's dining and ordering features using the `brag` skill and Hyperframes.
- **Workflow & Key Deliverables**:
  - **Skill & Toolchain Setup**: Verified the `brag` skill (`.agents/skills/brag`), installed Hyperframes CLI (`v0.8.47`), and integrated FFmpeg (`9.0.1-full_build`).
  - **4-Scene Storyboard & Audio-Synced Motion**:
    - **Scene 1 (Hook & Brand, 0.0–3.7s)**: Bold hook ("Craving Authentic Karachi Spice?"), golden luxury badge, and staggered dining modes (Dine-In, Takeaway, Delivery) beat-locked to 1.60s.
    - **Scene 2 (Granular Variation Engine, 3.7–9.5s)**: Interactive Special Chicken Biryani customization with Handi Portion toggle (Double), Spice Level (Karachi Spicy 🔥 locked to 5.80s cue), Add-ons (Shami Kebab), and live dynamic price calculation to Rs 1,450.
    - **Scene 3 (Dine-In QR & Live Order Tracking, 9.5–14.5s)**: Table #07 confirmation, Socket.IO live order tracking stepper (Order Received → Kitchen Prepping → Serving to Table), and WhatsApp notification alert.
    - **Scene 4 (Brand Outro & CTA, 14.5–19.5s)**: Saffron gold finale with brand seal, "The Art of Karachi Flavors", Order Now CTA button, and domain link.
  - **Pre-Render Quality Gate**: Checked with `npx hyperframes check` passing 86/86 WCAG AA contrast checks, 0 runtime errors, 0 layout errors, and 0 motion warnings.
  - **Render & Poster Bake**: Rendered 585 frames at 30fps (19.5s, 1920x1080) to `brag.mp4`, extracted settled poster frame `brag.jpg` at 17.5s, baked frame 0 as the universal video thumbnail, and wrote social `share-copy.txt`.

---

## 0. Phase 4.34 Micro-Change — Localhost Dev Bypass for 6:30 PM Restaurant Hours Lock (2026-09-18)

### Dev Environment Hours Lock Bypass
- **Files**:
  - `cafe-little-karachi/.env.local` (UPDATED)
  - `cafe-little-karachi/src/app/lib/restaurantStatus.ts` (UPDATED)
- **Context & Problem**: During local development (before 6:30 PM), `isOpenAt()` returned `false`, triggering the restaurant-closed overlay and redirect-to-home guard on checkout — making it impossible to test ordering flows without waiting until 6:30 PM.
- **Fix**: Added `NEXT_PUBLIC_DISABLE_HOURS_LOCK=true` to `.env.local`. The `isOpenAt()` function checks this env var **first** (before the `localStorage` override) and returns `true` immediately, bypassing all time-based gating. **Production is unaffected** — `.env.local` is `.gitignore`-d and the env var is absent in `.env.production`.

---

## 0. Phase 4.33 Micro-Changes — Direct Product Link Off-Hours Viewing & Lock / Location Check Coordination (2026-09-18)


### 1. Off-Hours Direct Product URL Unblocked Viewing
- **Files**:
  - `cafe-little-karachi/src/app/components/RestaurantStatusPopup.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/context/OrderContext.tsx` (UPDATED)
- **Context & Problem**: Previously, when a customer opened a direct product campaign URL (e.g. `https://www.littlekarachirestaurant.com/item/beef-white-biryani-1-kg-deg`) before 06:30 PM (when the restaurant is closed), the fullscreen `z-[9999]` "We are currently closed" modal would immediately take over the screen, blocking the customer from viewing the product popup, prices, and variations.
- **Fix & Enhancements**:
  - `RestaurantStatusPopup.tsx`: On initial mount, detects if the current URL starts with `/item/` or `/platter/`. If so, initializes in unblocked browse state so the full product customization modal renders cleanly without obstruction.
  - `OrderContext.tsx`: Added `isStatusModalOpen: boolean` and `setStatusModalOpen: (isOpen: boolean) => void` to global state for coordinated status popup control across modals.

### 2. Off-Hours vs On-Hours Product Dismiss ("Cut") & Add-to-Cart Workflow
- **Files**:
  - `cafe-little-karachi/src/app/components/MenuItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/PlatterItem.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/components/AddToCartButton.tsx` (UPDATED)
- **Behavior Implemented**:
  1. **Dismiss / Close Modal ("Cut")**:
     - **Before 06:30 PM (`!isOpenAt()`)**: Closes the product modal and immediately triggers the before 06:30 lock popup (`setStatusModalOpen(true)`).
     - **At or after 06:30 PM (`isOpenAt()`)**: If location/order type is not set (`!isLocationSet`), opens the location selector modal (`TableForm`).
  2. **Add to Cart**:
     - **Before 06:30 PM (`!isOpenAt()`)**: Closes the product modal and immediately triggers the before 06:30 lock popup (`setStatusModalOpen(true)`).
     - **At or after 06:30 PM (`isOpenAt()`)**: Adds the item to cart, and if location is not set (`!isLocationSet`), opens the location selector modal (`TableForm`).
  3. `AddToCartButton.tsx`: Added optional `onAddRequest?: () => void` prop to cleanly delegate add-to-cart orchestration to `MenuItem`.

### 3. Immediate Slug Propagation in Classic & CMS Layouts
- **File**:
  - `cafe-little-karachi/src/app/order/page.tsx` (UPDATED)
- **Changes**:
  - Forwarded `initialItemSlug` and `initialPlatterSlug` to `MenuItem` and `PlatterItem` in Classic Layout mode and CMS mode (`ItemGridSection`, `ItemSliderSection`) with `initialOpen={!!(initialSlug && slugify(title) === initialSlug)}` for instant modal opening.

---

## 0. Phase 4.32 Micro-Changes — Centered Minimalist Modern Footer Revamp (2026-09-17)

### 1. Minimalist Center-Aligned Footer Architecture
- **Files**:
  - `cafe-little-karachi/src/app/components/Footer.tsx` (UPDATED)
  - `the-chai-company/src/app/components/Footer.tsx` (UPDATED)
- **Context & Goal**: The user requested a complete footer revamp: removing all quick links, converting the layout to a center-aligned modern flow featuring solely the brand logo, authentic story/paragraph, social media links, interactive contact pills, operating hours, and copyright.
- **Key Enhancements & Structural Improvements**:
  1. **Clean Center-Aligned Layout**: Eliminated multi-column grid partitioning and legacy quick links (`/about`, `/menu`, `/contact`, `/terms`). Replaced with a centered flex column (`max-w-4xl mx-auto flex flex-col items-center text-center`).
  2. **Elevated Brand Logo & Ambient Glow**:
     - Embedded `/hd-logo.webp` in a circular backdrop-blurred emblem (`bg-[#5c0d40] border-2 border-white/20`) with ambient halo glow (`bg-gradient-to-r from-[#ff9824]/25 to-[#d0269b]/30 blur-xl`).
     - Interactive spring hover scale and micro-interactions on hover.
  3. **Readable Brand Story / Paragraph**: Added concise brand statement ("Experience authentic Karachi flavors at Little Karachi Express. Handcrafted traditional delicacies, premium dine-in, and fast delivery right to your doorstep.").
  4. **Interactive Contact Pills**:
     - **Direct Phone Call**: `tel:+923331702706` with `Phone` icon, pill styling, hover elevation, and `trackEvent('journey_call_click', ...)`.
     - **WhatsApp Support**: `wa.me/923331702706` with `FaWhatsapp` icon, emerald hover glow, and `trackEvent('journey_whatsapp_click', ...)`.
     - **Google Maps Directions**: Google Maps link with `Navigation` icon, amber glow, and `trackEvent('journey_find_location', ...)`.
  5. **Social Media Icons**:
     - Centered circular icon buttons for Facebook and Instagram with brand-specific hover border tints (`#1877F2` for Facebook, `#E4405F` for Instagram), scale micro-animations, and `trackEvent('journey_contact', ...)`.
  6. **Center Gradient Divider & Copyright Badge**:
     - Minimalist horizontal fade divider (`w-24 sm:w-36 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`).
     - Centered copyright year dynamic updater: `© {new Date().getFullYear()} Little Karachi Express. All rights reserved.`.
     - Pulse indicator with operating badge: `Open Daily · Dine-In, Takeaway & Express Delivery`.
  7. **Mobile Responsiveness & Scroll to Top**:
     - Wrapped pills in responsive flex-wrap with touch-friendly dimensions on mobile viewports.
     - Centered subtle "Back to Top" capsule button.

---

## 0. Phase 4.31 Micro-Changes — Image Banner Slider Zero-Cutoff, Smart Contain Fit & Single-Banner Sizing (2026-09-17)

### 1. Smart Zero-Cutoff Image Contain & Ambient Blurred Backdrop Glow
- **File**: `cafe-little-karachi/src/app/components/BannerSlider.tsx`
- **Root Cause**: Banners uploaded on PC were using `object-cover` inside fixed aspect-ratio containers (`21/8` desktop, `16/9` mobile), which caused the left and right edges (and crucial text/graphics) to be cropped and cut off when banner aspect ratios differed.
- **Fix Applied**:
  - **Zero-Cutoff Contain Default**: Upgraded slide image rendering to use `object-contain` as default fit mode, guaranteeing that 100% of the graphic is visible from edge to edge with zero cropping.
  - **Ambient Blurred Glow**: Injected `<div className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-110 opacity-30 dark:opacity-40 pointer-events-none" />` behind the image, softly filling any letterbox areas with the banner's own color palette.
  - **Single-Banner Mobile Sizing Adaptability**: When only a single PC banner is uploaded (`!s.mobileImage`), mobile automatically adapts to wide panoramic aspect ratio (`aspectRatio || '21/9'`) with contain fit, preventing mobile devices from forcing a 16:9 vertical crop that cuts off wide desktop banners.
  - **Frame Stacking**: Base container uses `bg-neutral-950` with high-contrast text overlays and arrows raised to `z-30`.

### 2. CMS Layout Controls & Mockup Visual Parity
- **File**: `cafe-little-karachi/src/app/components/AdminPageBuilder.tsx`
- **Features Implemented**:
  - **Desktop & Mobile Image Fit Dropdowns**: Added explicit controls (`contain`, `cover`, `fill`) under both `Desktop Layout & Sizing` and `Mobile Layout & Sizing`.
  - **Expanded Aspect Ratio Presets**: Added `auto` (Match PC Ratio for single banners), `21/8`, `21/9`, `16/9`, `2/1`, `3/1`, `4/1`, `4/3`, `1/1`.
  - **Mockup Previews**: Updated PC browser mockup (`aspect-[21/9]`) and Mobile phone mockup (`aspect-[9/16]`) to display contained images with ambient blurred backdrops in real-time.

### 3. TypeScript Schema Alignment
- **File**: `cafe-little-karachi/src/models/PageConfig.ts`
- **Change**: Added `'image-slider'` to `IPageSection.type` union and extended `BannerSlide` & `PageSection.props` interfaces with `imageFit?: 'contain' | 'cover' | 'fill'` and `mobileImageFit?: 'contain' | 'cover' | 'fill'`.

---

## 0. Phase 4.30 Micro-Changes — Cart Backdrop Blur Overlay & "Popular with your order" Upsell Carousel (2026-09-17)

### 1. Full-Screen Backdrop Blur Overlay Behind Cart Drawer
- **File**: `cafe-little-karachi/src/app/components/CartSidebar.tsx`
- **Feature**: Replaced the previous inner-panel constrained overlay with a full-screen `fixed inset-0 z-50` backdrop wrapper.
- **Visuals & Behavior**:
  - `bg-black/40` semi-transparent dark tint with `backdrop-filter: blur(8px)` and `[-webkit-backdrop-filter:blur(8px)]` for cross-browser Safari support.
  - Smooth fade in/out transition (`motion.div` with 220ms duration) perfectly synchronized with drawer open/close animation.
  - `pointer-events: auto` and `onClick={handleClose}` for intuitive modal-dismiss on outside click.
  - `will-change: backdrop-filter, opacity` optimized for high framerates on mobile.
  - The cart drawer `<motion.aside>` sits in front at `z-50`, razor sharp and in focus with zero blur applied to the drawer content itself.

### 2. "Popular with your order" Upsell Carousel & Admin Recommendation Manager
- **Files**:
  - `cafe-little-karachi/src/models/CartUpsellConfig.ts` (NEW)
  - `cafe-little-karachi/src/pages/api/cart-upsells.ts` (NEW)
  - `cafe-little-karachi/src/app/components/CartUpsellManagement.tsx` (NEW)
  - `cafe-little-karachi/src/app/components/CartSidebar.tsx` (UPDATED)
  - `cafe-little-karachi/src/app/admin/page.tsx` (UPDATED)
- **Cart Drawer Integration (`CartSidebar.tsx`)**:
  - Inserted between the `"Add more items"` dashed button and the Order Summary box.
  - **Header**: Vertical brand plum pill (`w-1 h-3.5 rounded-full bg-[#741052] dark:bg-[#d0269b]`) + Flame icon (`Flame`) + `"Popular with your order"` title + circular left/right chevron navigation buttons (`<ChevronLeft />`, `<ChevronRight />`).
  - **Scroll Engine**: Smooth horizontal carousel (`overflow-x-auto`, `scroll-smooth`, zero scrollbars), touch drag/swipe on mobile, and 140px programmatic card step on desktop chevrons with scroll-spy auto-disabling arrows at boundary limits.
  - **Product Card Styling**: Square aspect ratio thumbnail, overlaid circular "+" add button on bottom-right (`w-6 h-6 rounded-full bg-[#741052] text-white hover:scale-110 active:scale-90 shadow-md`), bold price (with strikethrough original price if discounted), and muted product title.
  - **1-Tap Add Action**: Tapping "+" calls `addToCart(...)` with quantity 1, immediately recalculates cart subtotal, delivery fee, and grand total without closing the cart drawer, with sonner toast feedback.
- **Admin Configuration Suite (`CartUpsellManagement.tsx` & `admin/page.tsx`)**:
  - Registered `Cart Upsells` tab in admin sidebar with `Flame` icon.
  - Includes Enable/Disable switch, custom section heading input, "Auto Popular" vs "Curated Handpicked" strategy toggle, searchable product catalog picker, sequence reordering (▲ ▼), and a live cart drawer simulation preview.

### 1. Dual-Choice Image System (Gallery vs Upload)
- **Files Modified**:
  - `cafe-little-karachi/src/app/components/MenuItemForm.tsx` (Add Menu Item)
  - `cafe-little-karachi/src/app/components/EditMenuItemForm.tsx` (Edit Menu Item)
  - `cafe-little-karachi/src/app/components/AddPlatterForm.tsx` (Add Platter)
  - `cafe-little-karachi/src/app/components/EditPlatterForm.tsx` (Edit Platter)
- **Features Implemented**:
  - **Dual Action Controls**: Two buttons side-by-side: `[ Choose Gallery ]` (launches `MediaGallery` in modal picker mode) and `[ Upload New ]` (triggers file picker for direct upload to Cloudinary in `cafe-little-karachi/menu_items` or `cafe-little-karachi/platters`).
  - **Interactive Image Card Preview**: Once an image is attached (from gallery or upload), displays a thumbnail preview with path/URL, "Change from Gallery", "Upload Replacement", and a 1-click remove/trash button.
  - **Embedded `MediaGallery` Picker Modal**: High-z-index (`z-[120]`) backdrop-blurred modal housing the `MediaGallery` component with `isPicker={true}`. Clicking "Select This Image" instantly binds the URL to the form state and closes the modal with a success toast.

---

## 0. Phase 4.28 Micro-Changes — Media Gallery: Used-In Detail, Storage Stats & Overlay Fix (2026-09-17)

### 1. "Used In" Detail Panel in Image Popup & Schema Alignment Fix
- **Files**: `src/pages/api/media-usage.ts` (NEW / UPDATED), `src/app/components/MediaGallery.tsx`
- **Root Cause & Compilation Fix**: `PageConfig` document does not have top-level `heroBannerDesktop` fields, and `MenuItem`/`Platter` schemas use `title` (not `name`). Updated `media-usage.ts` to query `MenuItem` (`title`, `category`), `Platter` (`title`, `platterCategory`), and inspect `PageConfig.sections` (`section.props.backgroundImage`, `section.props.mobileBackgroundImage`, `section.props.slides`, `section.props.image`), eliminating Next.js build compilation errors.
- **New API (`media-usage.ts`)**: `GET /api/media-usage?url=<cloudinaryUrl>` — uses `connectDB` from `@/lib/db`, extracts the public_id stem, queries MenuItem, Platter, and PageConfig (banners, sliders, story sections) in MongoDB, returns `{ total, usages: MediaUsageEntry[] }`.
- **Component**: `usedIn` + `loadingUsedIn` state. On `activeDetailItem` change, calls API. Popup right panel now shows a color-coded "Used In" section: loading spinner, empty dashed note ("Not used in any menu item…"), or pill rows for each usage with contextual icons (plum = menu item, amber = platter, blue = banner, violet = slider, emerald = story).

### 2. Total Storage Size & Media Count Stats Bar
- **File**: `src/app/components/MediaGallery.tsx`
- **Change**: Added `totalBytes` and `totalCount` via `useMemo`. Stats bar between bulk-selection area and grid shows: 🖼 Media Count (+ filtered count), 💾 Total Storage in human-readable format. Amber italic note shown when more images are available via `nextCursor`.

### 3. Image Popup Overlay Not Covering Full Screen
- **File**: `src/app/components/MediaGallery.tsx`
- **Root Cause**: AdminHeader `sticky top-0 z-30 backdrop-blur-xl` creates a new CSS stacking context; siblings at `z-[110]` visually render underneath the header compositing layer on Chrome/Edge.
- **Fix**: Raised popup overlay `z-[110]` → `z-[300]`, darkened backdrop to `bg-black/80`. Added `overflow-y-auto` to the right metadata column so the new "Used In" section doesn't overflow the modal.

---

## 0. Phase 4.27 Micro-Changes — Live Orders Color Theme Unification (2026-09-17)

### Problem
Color palette was inconsistent: "Delivered" status used flat `neutral-800` (grey), Delivery/Pickup order-type badges used plain `neutral-100/neutral-800`, and contact "Call" buttons used `neutral-200/neutral-800` — all clashing with the CLK Royal Plum identity (`#741052`).

### Fix Applied
**File**: `cafe-little-karachi/src/app/components/OrdersList.tsx`
- **ORDER_TYPE_CONFIG**: `delivery` → `#96156a` rose-plum tint; `pickup` → `#5c0d40` deep plum tint (both on-brand)
- **HUD "Delivered" button**: deep plum gradient (`#3d0a2b → #5c0d40`) — not grey
- **HUD "All Orders" button**: `#741052` plum family icon & counts — not `neutral-900`
- **Grid order cards**: Delivered state top banner → `from-[#3d0a2b] to-[#5c0d40]` gradient; border → plum-tinted
- **Delivered badge/pill** (grid, kanban, table): `#3d0a2b/10` bg + `#5c0d40` text — consistent
- **"Undo" buttons** everywhere: `#741052/10` bg + `#741052` text — plum family
- **Call Phone button** (cards + modal): `#5c0d40/10-15` bg + `#5c0d40` text — not plain grey
- **Kanban Delivered column**: plum-tinted border/bg/badge to match Received column style
- **Modal header** (delivered): `from-[#3d0a2b] to-[#5c0d40]` gradient — not flat `neutral-800`
- **Rationale**: All states and UI elements now live in the same CLK Royal Plum family. Lighter/darker shades of `#741052` distinguish active vs completed without introducing off-brand greys.

## 1. Phase 4.26 Micro-Changes — Live Orders Tab Luxury Revamp & 2-Status Simplification (2026-09-17)

### Live Orders Operations Hub & 2-Status Simplified Workflow
- **Files**:
  - `cafe-little-karachi/src/app/components/OrdersList.tsx`
  - `cafe-little-karachi/src/pages/api/fetchCompletedOrders.ts`
  - `cafe-little-karachi/src/app/admin/page.tsx`
- **Context**: The user requested removing all multi-step intermediate statuses (Preparing, Ready, Out for delivery, Cancelled) and simplifying the Live Orders workflow to just **2 statuses**: `Received` and `Delivered`, making it completely intuitive and effortless for restaurant managers.
- **Key Upgrades & Architectural Enhancements**:
  1. **2-Status Core Workflow**:
     - 🟡 **`RECEIVED`** (Pending / In Progress): Displays with an alert badge and a giant, prominent 1-click **`[ ✓ MARK AS DELIVERED ]`** action button.
     - 🟢 **`DELIVERED`** (Completed / Fulfilled): Displays with a green checkmark badge and an **`[ Undo ]`** button.
     - Legacy orders with intermediate statuses are automatically treated as active `Received` until marked `Delivered`.
  2. **Big Visual Top Filter Strip**:
     - `RECEIVED` button with pending count and live revenue.
     - `DELIVERED` button with completed count.
     - `ALL` button for full history.
  3. **High-Legibility Scannable Cards**:
     - Large `#CLK-XXXX` copyable order ID.
     - High-contrast order mode badges (🛵 Delivery + Area, 🍽️ Dine-in + Table #, 🛍️ Pickup).
     - 1-Click large green **WhatsApp** button and blue **Phone Call** button.
     - Large bold item titles and quantity badges (`2× Chicken White Biryani`).
  4. **Backend Completed Query Parity (`fetchCompletedOrders.ts`)**:
     - Updated case-insensitive regex to `/^(completed|delivered)$/i` to seamlessly retrieve both `Delivered` and `Completed` orders.
  5. **Admin Container Cleanup (`admin/page.tsx`)**: Removed redundant nested `<Card className="p-6">` so `OrdersList` renders as a full-bleed standalone operations suite.

---

## 0. Phase 4.25 Micro-Changes — Admin Panel Tab Label Renaming (2026-09-17)

### Admin Dashboard Tab Label Updates
- **File**: `cafe-little-karachi/src/app/admin/page.tsx`
- **Context**: The user requested renaming the admin sidebar and header tabs for consistency and clarity.
- **Changes**:
  - Renamed tab `Menu Catalog` (`key: 'menu'`) to **`Menu Items`**.
  - Renamed tab `Gourmet Platters` (`key: 'platter'`) to **`Platter Items`**.
  - Both the desktop/mobile sidebar navigation items and the top `AdminHeader` breadcrumb title automatically synchronize with these updated labels via the `TABS` array.

---

## 0. Phase 4.24 Micro-Changes — Order Page Category Sorting & Unified Sequence Rendering (2026-09-16)

### Elimination of Platter-First Partitioning & Direct Sequence Rendering
- **Files**:
  - `cafe-little-karachi/src/app/order/page.tsx`
  - `cafe-little-karachi/src/pages/api/page-config.ts`
  - `cafe-little-karachi/src/app/components/AdminPageBuilder.tsx`
- **Root Cause**: In Classic Layout mode (`!useCmsLayout`), `order/page.tsx` previously split `visibleClassicCategories` into two separate arrays: `activePlatterCategoryOrder` (filtered by `isPlatter: true`) and `activeMenuCategoryOrder` (filtered by `isPlatter: false`), rendering a container for all platters first and another container for all dish menu items second. This hardcoded separation forced platters to always render above dish menu items regardless of the ordering sequence defined in the CMS tab.
- **Changes**:
  - `order/page.tsx`: Removed the split arrays and replaced the dual-container render with a single unified `.map(categoryConfig => ...)` over `visibleClassicCategories`. Each category (platter or dish menu) now renders in its exact sequential index (`#1`, `#2`, `#3`, etc.) configured in the CMS tab.
  - `page-config.ts` & `AdminPageBuilder.tsx`: Added `{ id: 'pulao-com', name: 'Pulao.com', isPlatter: false, isVisible: true }` to `DEFAULT_CLASSIC_CATEGORIES`.

---

## 0. Phase 4.23 Micro-Changes — White Biryani Products Upload to Pulao.com Category (2026-09-16)

### Product Catalog Seeding & Category Configuration
- **Files**:
  - `cafe-little-karachi/scripts/upload-pulao-products.ts`
  - MongoDB `menuitems` collection
  - MongoDB `categories` collection
  - MongoDB `pageconfigs` (`classicCategories`)
- **Context**: The user requested 6 White Biryani dishes (Deg sizes and portion sizes for Chicken & Beef) to be uploaded into the `Pulao.com` category with initial placeholder images.
- **Uploaded Products**:
  1. `Chicken White Biryani – 1 KG Deg` — Rs. 2,050 (`1 KG Chicken, 1 KG Rice`)
  2. `Beef White Biryani – 1 KG Deg` — Rs. 2,950 (`1 KG Beef, 1 KG Rice`)
  3. `Chicken White Biryani – 375 Gram` — Rs. 225 (`375 Gram – Rice, 1 Chicken Piece, Aloo`)
  4. `Beef White Biryani – 375 Gram` — Rs. 275 (`375 Gram – Rice, 3 Beef Pieces, Aloo`)
  5. `Chicken White Biryani – 500 Gram` — Rs. 300 (`500 Gram – Rice, 1 Chicken Piece, Aloo`)
  6. `Beef White Biryani – 500 Gram` — Rs. 370 (`500 Gram – Rice, 4 Beef Pieces, Aloo`)
- **Changes**:
  - Inserted all 6 documents into `menuitems` with UUIDs, `isVisible: true`, `status: 'in stock'`, `sortOrder: 1..6`, and high-res Cloudinary placeholder images.
  - Confirmed `Pulao.com` entry in `categories` collection.
  - Added `{ id: 'pulao-com', name: 'Pulao.com', isPlatter: false, isVisible: true }` into `PageConfig.classicCategories` to guarantee immediate navigation strip and catalog rendering on the live storefront.

---

## 0. Phase 4.22 Micro-Changes — Variable Delivery Charge Display for On-Demand Areas (2026-09-16)

### Variable Charge Labeling for On-Demand Delivery Areas
- **Files**:
  - `cafe-little-karachi/src/app/components/TableForm.tsx`
  - `cafe-little-karachi/src/app/checkout/page.tsx`
- **Context**: Delivery areas with on-demand charges (such as Shahrah-e-Faisal with `charge: 0` and note `"Charges on demand"`) previously displayed `Rs. 0` in dropdown selectors and `Rs. 0.00` in order summaries, which could be misinterpreted by customers as free delivery.
- **Changes**:
  - `TableForm.tsx`: Updated delivery area dropdown option rendering to display `(Variable)` instead of `(Rs. 0)` when `Number(area.charge) === 0` (e.g., `Shahrah-e-Faisal (On Demand) (Variable) - Charges on demand`).
  - `checkout/page.tsx` (Zone Badge): Updated Delivery Area badge header to display `Delivery: Variable` when `deliveryCharge === 0`.
  - `checkout/page.tsx` (Area Select Dropdown): Updated dropdown options to render `(Variable)` instead of `(Rs. 0)` when `Number(a.charge) === 0`.
  - `checkout/page.tsx` (Sidebar Order Summary): Rendered `Variable` in place of `Rs. 0.00` when `deliveryCharge === 0`.
  - `checkout/page.tsx` (Mobile/Bottom Summary): Rendered `Variable` in place of `Rs. 0.00` when `deliveryCharge === 0`.
  - Preserved standard numeric charge formatting (e.g., `Rs. 200.00`) for areas with fixed non-zero charges even if they include operational notes.

---

## 0. Phase 4.21 Micro-Changes — Social Media Links Update & Dummy # Cleanup (2026-09-16)

### Footer Social Links Update & Placeholder Removal
- **File**: `cafe-little-karachi/src/app/components/Footer.tsx`
- **Context**: The customer footer previously had placeholder dummy links (`href="#"`) for Facebook, Instagram, Twitter, and LinkedIn.
- **Changes**:
  - Replaced dummy Facebook link with official page: `https://www.facebook.com/littlekarachiexpress`.
  - Replaced dummy Instagram link with official profile: `https://www.instagram.com/littlekarachiexpress`.
  - Removed Twitter and LinkedIn social buttons entirely (cleaning out unused `#` placeholders).
  - Cleaned up icon imports by removing unused `FaTwitter` and `FaLinkedin` from `react-icons/fa`.
  - Added `target="_blank"` and `rel="noopener noreferrer"` for secure new-tab navigation.
  - Added explicit accessibility `aria-label` attributes (`"Facebook"`, `"Instagram"`).
  - Attached analytics tracking `trackEvent('journey_contact', { channel: item.label.toLowerCase(), destination: item.href, source: 'footer' })` to capture social visits in Meta Pixel (`Contact` standard event) and Clarity.

---

## 0. Phase 4.20 Micro-Changes — Delivery Charges Timing Race Fix & Modal Footer (2026-09-15)

### Delivery Areas API Timing Race Fix
- **File**: `src/app/checkout/page.tsx`
- **Root Cause**: The main init `useEffect` (responsible for syncing `orderType`, `tableId`, `area` from `OrderContext` into checkout state) ran **before** the `fetch('/api/delivery-areas')` call completed. At that point, `deliveryAreas = []`, so `findMatchingArea(area, [])` returned `null` and `selectedDeliveryArea` was never set. `selectedAreaObj` thus resolved to `null` → `deliveryCharge = 0` in both the sidebar order summary and the confirmation modal.
- **Fix**: Added a dedicated `useEffect(() => { ... }, [deliveryAreas])` that fires exclusively when `deliveryAreas` populates. It checks `selectedDeliveryArea === ""` (not already set by user) and then calls `findMatchingArea(detectedArea || area || formData.area, deliveryAreas)` to re-sync the selected area and delivery charge as soon as the API data is available.

### Confirmation Modal Sticky Footer Fix
- **File**: `src/app/checkout/page.tsx`
- **Root Cause**: The "Place Order" / "Cancel" action footer div (with class `flex-shrink-0`) was nested **inside** the `flex-1 overflow-y-auto p-6` scrollable content div. The `flex-shrink-0` had no effect because it was a child of the scrollable overflow container, not a sibling in the flex column. This caused the footer to scroll with content and potentially disappear below the viewport on smaller screens.
- **Fix**: Moved the footer div **outside** the `overflow-y-auto` scrollable div but still inside the `flex flex-col` modal container. The modal now has the correct `[Header][Scrollable Content][Sticky Footer]` flex layout. Updated `p-6` to `px-6 py-4` for compact spacing.

---

## 0. Phase 4.19 Micro-Changes — Classic Layout Category Configuration via CMS (2026-09-14)

### PageConfig Schema & API: `classicCategories` Field
- **Files**: `src/models/PageConfig.ts`, `src/pages/api/page-config.ts`
- **Changes**:
  - Added `classicCategories` schema field containing array of `{ id: String, name: String, isPlatter: Boolean, isVisible: Boolean }`.
  - Default initialization includes all 10 legacy categories in their original hardcoded order (3 platter categories: Sharing Platters, Meal Boxes, Fast Food Deals; 7 menu categories: Very Fast Food, Beast BBQ, Pizza Parlour, Hotpot and Chinese, Rolls Royce, The Chai Company, Very Extra).
  - API `GET` returns `classicCategories` (initializing defaults if unset), and `POST` persists updates.

### Order Page: Removed Hardcoded Categories (`order/page.tsx`)
- **File**: `src/app/order/page.tsx`
- **Changes**:
  - Removed static `defaultPlatterCategoryOrder` and `defaultMenuCategoryOrder` arrays.
  - Added `classicCategories` state dynamically populated from `/api/page-config`.
  - `fetchClassicData` dynamically fetches data only for active visible platter and menu categories.
  - Classic mode rendering and `CategoryNavStrip` dynamically compute category lists from `classicCategories.filter(c => c.isVisible !== false)`.

### Admin CMS: Classic Categories Manager (`AdminPageBuilder.tsx`)
- **File**: `src/app/components/AdminPageBuilder.tsx`
- **Changes**:
  - Built `ClassicCategoriesManager` component rendered on the canvas when Classic Normal Layout is active.
  - Category controls:
    - Reordering: `▲` Move Up, `▼` Move Down, `⤒` Move to Top, `⤓` Move to Bottom.
    - Visibility Toggle: `<Eye>` / `<EyeOff>` toggles category on the live `/order` page without deletion.
    - Remove: `<Trash2>` removes category from classic layout.
    - Add Category Form: Segmented selector (`Dish Menu` vs `Gourmet Platter`), choose existing DB category or enter custom name.
    - Reset to Defaults: `<RotateCcw>` restores the original 10 categories.
    - Filter Tabs: All, Platters, Dish Menu with real-time visible counter badges.
  - Sidebar Overview: Displays active category counter and preview list in Classic Mode.

---

## 0. Phase 4.18 Micro-Changes — EditMenuItemForm Modern Redesign (2026-09-14)

### EditMenuItemForm — Modern Compact Layout & Visual Parity with EditPlatterForm
- **File**: `src/app/components/EditMenuItemForm.tsx`
- **Changes**:
  - **Outer Modal**: Constrained to `max-h-[88vh] flex flex-col overflow-hidden` with sticky header bar (`UtensilsCrossed` icon + title + subtitle + `X` close button) and sticky action footer (`Cancel` + `Save Changes`).
  - **Scrollable Two-Column Form**: Left column houses Basic Information (Title, Description, Base Price, Category dropdown + New Category trigger), Discount & Promotion (Value + Type), Availability & Visibility, and Item Image. Right column houses Variations (Sizes/Portions) with sticky "+ Add Variation" button.
  - **Current Image Preview**: When `formData.image` is set, displays a clean `h-28 object-cover rounded-xl` thumbnail with a `"Current image"` overlay badge, accompanied by a styled dashed upload box indicating dynamic states ("Upload image" / "Replace image" / "Uploading...").
  - **Pill Toggles**: Converted status dropdown and visibility checkbox into side-by-side pill toggle button groups (In Stock / Out for stock, Visible / Hidden for visibility).
  - **Variations UI**: Clean list with Variation Name input, Price input, and red `<Trash2>` delete button. Shows a styled dashed empty state and a clean info box when no variations exist.
  - **Design Tokens**: Standardized on `neutral-*` Tailwind tokens, clean uppercase `SectionHeading` divider lines, and zero emojis throughout the component.

---

## 0. Phase 4.17 Micro-Changes — EditPlatterForm Redesign (2026-09-14)

### EditPlatterForm — Delete Buttons on Additional Choices
- **File**: `src/app/components/EditPlatterForm.tsx`
- **Change**: Each Additional Choice card now has a `<Trash2>` icon button in its heading row that calls `handleRemoveChoice(index)`. Each individual option row within a choice has an `<X>` icon button that calls `handleRemoveOption(choiceIndex, optionIndex)`. An "Add option" link (Plus icon) within each choice card calls `addOptionToChoice(choiceIndex)`.
- **Handler additions**: Replaced the single `handleAdditionalChoiceChange` with three targeted handlers: `handleAdditionalChoiceHeadingChange`, `handleAdditionalOptionChange`, and `addOptionToChoice`.

### EditPlatterForm — Current Image Preview
- **File**: `src/app/components/EditPlatterForm.tsx`
- **Change**: When `formData.image` is truthy, renders a `<img>` tag above the upload input with `h-28 object-cover` and a `"Current image"` overlay badge. Upload input replaced with a styled `<label>` (dashed border, Upload icon) that shows contextual text: "Upload image" → "Replace image" → "Uploading..." based on state.

### EditPlatterForm — Modern Compact Redesign
- **File**: `src/app/components/EditPlatterForm.tsx`
- **Changes**:
  - Outer modal: `max-h-[88vh] flex flex-col overflow-hidden` with sticky header bar (title + subtitle + X close button) and sticky footer bar (Cancel + Save Changes).
  - Scrollable body: `overflow-y-auto flex-1` wraps the two-column form grid.
  - Two-column layout retained; left column order: Basic Info → Discount → Availability → Image. Right column: Additional Choices → Categories.
  - `SectionHeading` inner component: `<span>` label + `<hr>` divider line, no emojis.
  - Status and Visibility: replaced checkbox+select with two side-by-side pill toggle buttons (emerald/red for stock, plum/neutral for visibility).
  - Add buttons changed from filled gradient buttons to dashed-border outline buttons with Plus icon.
  - Category remove button moved inline into the category card header row as a `<Trash2>` icon.
  - All `gray-*` Tailwind classes replaced with `neutral-*` for consistent theming.
  - No emojis used anywhere in the component.

---

## 0. Phase 4.16 Micro-Changes — Item Order Sorting Tab & CMS Classic Mode Cleanup (2026-09-14)

### Schema: `sortOrder` Field Added to MenuItem & Platter
- **Files**: `src/models/MenuItem.ts`, `src/models/Platter.ts`
- **Change**: Added `sortOrder: { type: Number, default: 0 }` field to both Mongoose schemas and TypeScript interfaces.
- **Rationale**: Enables persistent, admin-controlled manual display ordering of products per category.

### New API: Product Sort Order Endpoint
- **File**: `src/pages/api/updateProductSortOrder.ts`
- **Change**: Created `PUT` endpoint accepting `{ type: 'menu' | 'platter', items: Array<{ id: string; sortOrder: number }> }`. Uses MongoDB `bulkWrite` with `updateOne` for atomic batch updates in a single DB round-trip.
- **Rationale**: Efficient batch persistence of drag-and-drop or quick-move reordering without N individual API calls.

### Data Fetching: Sort Order Respected in All Item Queries
- **Files**: `src/pages/api/getitems.ts`, `src/pages/api/getitemsadmin.ts`, `src/pages/api/platter.ts`, `src/pages/api/platteradmin.ts`
- **Change**: Added `.sort({ sortOrder: 1, createdAt: 1 })` to all Mongoose queries. Customer-facing and admin-facing endpoints now both respect admin-set manual ordering.

### New Component: `ItemOrderSorting.tsx`
- **File**: `src/app/components/ItemOrderSorting.tsx`
- **Change**: Built full-featured drag-and-drop item reordering component:
  - Mode switch: Menu Dishes vs. Gourmet Combo Platters
  - Left sidebar: Live categories list with item count badges
  - Right canvas: `@dnd-kit` drag-and-drop + `▲ ▼ ⤒ ⤓` quick-move buttons per item
  - Position rank badges (`#1`, `#2`, `#3`, gradient CLK plum for position 1)
  - Unsaved-changes detection with pulsing amber warning + Reset/Save inline buttons
  - `PUT /api/updateProductSortOrder` on save with toast success/failure notifications

### Admin Panel: `itemSorting` Tab Wired
- **File**: `src/app/admin/page.tsx`
- **Changes**:
  - Added `ArrowUpDown` to Lucide imports.
  - Imported `ItemOrderSorting` from `./ItemOrderSorting`.
  - Added `'itemSorting'` to `TabKey` union type.
  - Added `{ key: 'itemSorting', label: 'Item Order Sorting', icon: ArrowUpDown }` to `TABS` array (between `layoutBuilder` and `settings`).
  - Extended `useEffect` trigger: also fetches menu + platter items when `activeTab === 'itemSorting'`.
  - Added render block: `{activeTab === 'itemSorting' && <ItemOrderSorting menuItems={menuItems} platterItems={platterItems} isLoading={...} refreshData={...} />}`.

### CMS Classic Mode Clean View — Canvas
- **File**: `src/app/components/AdminPageBuilder.tsx`
- **Change**: Wrapped `sections.map(...)` and the "Empty Page Layout" empty-state block inside `{useCmsLayout && (...)}`. When Classic Normal Layout Mode is active (`useCmsLayout === false`), only the Classic banner/slider editor is visible in the canvas — no CMS section cards clutter the view.

### CMS Classic Mode Clean View — Sidebar
- **File**: `src/app/components/AdminPageBuilder.tsx`
- **Change**: Wrapped the sidebar section preset groups list (`Header & Banners`, `Products & Lists`, `Content & Reviews`, `Structure`) in a `{useCmsLayout ? (...presets...) : (...info card...)}` conditional. When Classic Mode is active, shows a clean amber warning card + "Classic Layout Overview" checklist card instead of clickable section presets (which would be non-functional in Classic mode).

---

## 0. Phase 4.15 Micro-Changes — Configurable Checkout & Bulk Discount Management (2026-09-14)

### Hardcoded Checkout Discount Removal & Dynamic Integration
- **File**: `src/app/checkout/page.tsx`
- **Root Cause**: `discountAmount` was statically computed as `totalAmount * 0.10`, causing an unconditional 10% discount on every checkout order, in order totals, and on WhatsApp receipts.
- **Fix**:
  - Replaced hardcoded discount with dynamic `discountConfig` fetched from `/api/discount-config`.
  - Added conditional qualification check: only applies when `discountConfig.isActive === true`, `discountConfig.discountValue > 0`, and `totalAmount >= (discountConfig.minOrderAmount || 0)`.
  - Added support for both `percentage` (`(totalAmount * value) / 100`) and `fixed` (`Math.min(totalAmount, value)`) discount calculations.
  - Formatted dynamic discount label `${discountConfig.label} (${discountConfig.discountType === 'percentage' ? `${discountConfig.discountValue}%` : `Rs. ${discountConfig.discountValue}`})`.
  - Conditionally rendered discount rows in the sidebar order summary and the confirmation modal only when `discountAmount > 0`.
  - Updated WhatsApp notification builder to dynamically include `- Discount: Rs. ...` only when a live discount applies.

### Backend Discount Configuration Model & API Endpoint
- **Files**:
  - `src/models/DiscountConfig.ts`
  - `src/pages/api/discount-config.ts`
  - `src/pages/api/bulkUpdateCategoryDiscount.ts`
- **`DiscountConfig.ts`**: Mongoose model with `isActive: boolean`, `discountType: 'percentage' | 'fixed'`, `discountValue: number`, `minOrderAmount: number`, and `label: string`.
- **`discount-config.ts`**: REST handler supporting `GET` (retrieves config or initializes default inactive record) and `POST`/`PUT` (persists updated discount settings and automatically deactivates if value is set to 0).
- **`bulkUpdateCategoryDiscount.ts`**: Upgraded to support `category: 'all'` or `type: 'all'`, allowing administrators to apply or remove discounts across all menu items and platter combo deals in a single operation.

### Admin Panel Bulk Discount Management & Live Monitor Overhaul
- **File**: `src/app/components/BulkDiscountManagement.tsx`
- **Live Discounts Monitor**: Top dashboard bar displaying real-time live discount status (pulsing `LIVE DISCOUNTS ACTIVE` badge, Live Checkout Discount card, Total Discounted Products counter, and active category tags list) with 1-click "Clear All Live Discounts" safety action.
- **Global Checkout / Cart Discount Controller**: Configurable card with enable/disable action button, Percentage vs Fixed amount selector, discount value input, minimum cart subtotal requirement, custom campaign label, and live customer checkout simulation preview.
- **Storewide Catalog Bulk Discount Tool**: 1-click tool to apply or remove percentage/fixed discounts across all products and platters simultaneously.
- **Enhanced Category Cards**: Real-time active discount badges, collapsible product preview grids, and category-level discount controls.

## 0. Phase 4.14 Micro-Changes — ViewCart Meta Pixel Event & Floating WhatsApp Contact Pixel Fix (2026-09-11)

### ViewCart Meta Pixel Event Implementation
- **Files**:
  - `src/app/lib/metaPixel.ts`
  - `src/app/lib/analytics.ts`
  - `src/app/components/CartSidebar.tsx`
  - `src/lib/metaCapi.ts`
- **`metaPixel.ts`**: Added `trackMetaViewCart` typed helper function which formats `items` into `contents` and `content_ids` arrays and dispatches custom Meta event `ViewCart` via `fbqCustom('ViewCart', { content_ids, contents, content_type: 'product', value, currency: 'PKR', num_items })`.
- **`analytics.ts`**:
  - Imported `trackMetaViewCart` from `./metaPixel`.
  - Added `journey_view_cart: 'clk_view_cart'` and `journey_add_platter_to_cart: CLK_FUNNEL_ADD_TO_CART` to `CLARITY_EVENT_MAP`.
  - Added `eventType === 'journey_view_cart'` branch in `trackEvent` to automatically dispatch `trackMetaViewCart`.
- **`CartSidebar.tsx`**:
  - Imported `trackEvent` from `../lib/analytics`.
  - Wired `trackEvent('journey_view_cart', { item_count, total_amount, items })` inside the component's mount `useEffect`, guaranteeing every time a user opens the cart drawer, the event is logged to internal analytics, Clarity, and Meta Pixel.
- **`metaCapi.ts`**: Added `'ViewCart'` to `SendMetaCapiEventOptions.eventName` union type.

### Floating WhatsApp Button Contact Pixel Fix
- **File**: `src/app/components/WhatsAppButton.tsx`
- **Root Cause**: The desktop floating WhatsApp button rendered a `<motion.a>` without an `onClick` event handler, causing clicks on the floating WhatsApp widget to bypass analytics.
- **Fix**:
  - Imported `trackEvent` from `../lib/analytics`.
  - Added `onClick` handler on the primary `<motion.a>` button calling `trackEvent('journey_whatsapp_click', { channel: 'whatsapp', source: 'floating_button', destination: whatsappNumber })`.
  - Added `onClick` handler on the tooltip pill anchor calling `trackEvent('journey_whatsapp_click', { channel: 'whatsapp', source: 'floating_button_tooltip', destination: whatsappNumber })`.
  - `journey_whatsapp_click` routes directly to `trackMetaContact({ contactType: 'whatsapp', source, destination })`, correctly firing the standard `Contact` Meta Pixel event.

### Disabled Automatic Button Tracking (`SubscribeButtonClick` Fix)
- **File**: `src/app/providers/MetaPixelProvider.tsx`
- **Root Cause**: Meta Pixel defaults `autoConfig: true`, which attaches automatic click and form heuristic listeners to all page buttons, unexpectedly firing events like `SubscribeButtonClick` on button clicks.
- **Fix**: Injected `fbq('set', 'autoConfig', false, '${pixelId}');` immediately prior to `fbq('init')` in the `<Script>` initialization block. This suppresses automatic heuristic button click listeners while leaving all custom and standard events (`trackMetaAddToCart`, `trackMetaViewContent`, `trackMetaViewCart`, `trackMetaInitiateCheckout`, `trackMetaPurchase`, etc.) fully functional.

## 0. Phase 4.13 Micro-Changes — Horizontal Category Navigation Strip Below Hero Banner (2026-09-11)

### Reusable Category Navigation Strip Component
- **Files**:
  - `src/app/components/CategoryNavStrip.tsx`
  - `src/app/order/page.tsx`
- **Visual Design & Theming**:
  - **Background & Border**: Soft light purple/lavender tint (`bg-[#f6eff7] dark:bg-[#250a20]`) with subtle purple border (`border-[#741052]/15 dark:border-[#d0269b]/25`) matching Cafe Little Karachi's pink-purple theme.
  - **Container & Edges**: Subtle rounded edges (`rounded-2xl`) with soft ambient shadow (`shadow-[0_2px_14px_rgba(116,16,82,0.06)]`).
  - **Full Width & Header Alignment**: Width set to `w-full` with matching responsive gutters (`px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14`), ensuring strict alignment with the header on phones, tablets, laptops, and wide screens.
- **Scrollbar Suppression**:
  - Completely removed scrollbars across Windows Chrome, macOS Safari, and Firefox via `style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}` and Tailwind classes `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:[display:none]`.
- **Labels & Spacing**:
  - Displayed platter categories followed by menu item categories.
  - Bold dark purple or black text (`font-bold text-[#330523] dark:text-neutral-200 hover:text-[#741052] dark:hover:text-white`).
  - Consistent padding between items (`gap-2 sm:gap-3 md:gap-4 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl`), with zero vertical dividers.
  - Active category highlighted with brand plum pill (`bg-[#741052] text-white shadow-md shadow-[#741052]/25 scale-[1.02]`).
- **Fixed Circular Arrow Buttons**:
  - Fixed white circular buttons (`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-neutral-900 border border-[#741052]/25 dark:border-[#d0269b]/40 shadow-md`) mounted at left and right ends over lavender gradient fade masks (`bg-gradient-to-r / to-l from-[#f6eff7] via-[#f6eff7]/95 to-transparent`).
  - Subtle purple chevron icons (`ChevronLeft`, `ChevronRight` with `text-[#741052] dark:text-[#d0269b]`).
  - Clicking shifts the horizontal scroll container by 260px smoothly. Buttons automatically disable with reduced opacity when scrolled to either extreme.
- **Sticky Behavior & Full-Page Context**:
  - `CategoryNavStrip` styled with `sticky top-0 z-30` and `backdrop-blur-md bg-white/80 dark:bg-black/80`.
  - In `order/page.tsx`, wrapped CMS sections in `Fragment` so that `CategoryNavStrip` is a direct child of the root `min-h-screen` container rather than nested inside the banner div. This ensures its sticky positioning context spans the entire height of the catalog.
- **Dynamic Real-Time Active Category Sync (Scroll-Spy)**:
  - Utilizes viewport-relative `getBoundingClientRect().top <= 160` to determine the visible category heading in real time.
  - Automatically updates `activeCategoryId` as customers scroll up and down the page.
  - Smoothly auto-centers the active pill in the horizontal strip using `activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })`.
- **Calibrated Click-To-Category Navigation**:
  - Clicking any category animates `window.scrollTo` with an `85px` top offset so section headers rest cleanly below the sticky navigation bar without being obscured.
- **Classic & CMS Dual Mode Integration**:
  - In Classic Layout mode: Renders directly below `BannerSlider` or `Hero`, passing `defaultPlatterCategoryOrder` + `defaultMenuCategoryOrder`.
  - In CMS Layout mode: Renders directly below the first visible hero or image-slider section, dynamically mapping all visible product sections.

## 0. Phase 4.12 Micro-Changes — Meta Pixel Lead→Purchase & Platter AddToCart Fix (2026-09-11)

### Meta Pixel: `trackMetaLead` Removed, Feedback Fires `Purchase` Instead
- **Files**: `src/app/lib/metaPixel.ts`, `src/app/lib/analytics.ts`
- **Rationale**: `trackMetaLead` fired a `Lead` Meta Pixel event on feedback submission from the thank-you page. `Lead` has no meaningful use case in a restaurant ordering funnel.
- **`metaPixel.ts`**: Removed the entire `trackMetaLead` function.
- **`analytics.ts`**: Removed `trackMetaLead` from imports. Changed `journey_feedback_submitted` / `journey_lead` branch to call `trackMetaPurchase({ orderNumber, totalAmount })` instead — only fires if `orderNumber` is present.

### Platter AddToCart: Always Adds Immediately (No Longer Blocked by Location Modal)
- **File**: `src/app/components/PlatterItem.tsx`
- **Root Cause**: `handleAddRequest` checked `isLocationSet` first. If unset, item was queued in `pendingCartItem.current` and location modal opened — but cart was not updated until after modal dismiss. Menu items never had this gate.
- **Fix**: Removed `pendingCartItem` ref, `prevIsLocationSet` ref, and deferred-flush `useEffect`. `handleAddRequest` now always calls `performCartAdd()` immediately. If `isLocationSet` is false, location modal opens 300ms after (non-blocking). Removed unused `useRef` from React import.

## 1. Phase 4.11 Architecture Changes — Image Banner Slider Mobile Scaling & Separate Mobile Customizations


### Image Banner Slider Dot Navigation & Mobile Scaling (2026-09-11)
- **Files**:
  - `src/app/components/BannerSlider.tsx`
  - `src/app/components/AdminPageBuilder.tsx`
  - `src/app/order/page.tsx`
- **Carousel Navigation Indicator Proportions Refinement (Perfect Half)**:
  - Height halved to 2px–2.5px (`h-[2px] sm:h-[2.5px]`).
  - Circular dots scaled down accordingly to 2px–2.5px round circles (`w-[2px] sm:w-[2.5px] h-[2px] sm:h-[2.5px]`) in muted semi-transparent white (`bg-white/45`).
  - Active slide rendered as an elongated horizontal pill kept wide and expanded to 28px–36px wide (`w-7 sm:w-8 md:w-9`) in solid white (`bg-white shadow-md`), sharing the exact same 2px–2.5px height.
  - Spacing set to balanced `gap-1.5 sm:gap-2`.
  - Horizontally centered at the bottom of the banner (`left-1/2 -translate-x-1/2 bottom-1.5 sm:bottom-2`).
  - Encased in a frosted glass capsule pill (`bg-black/35 backdrop-blur-md border border-white/10 px-2 sm:px-2.5 py-[2px] sm:py-[3px] rounded-full shadow-lg`).
  - Preserved accessible click target via `before:-inset-2` expansion.
  - Fluid, animated morph transition (`transition-all duration-300 ease-out`) between dot and pill on slide change.
- **Mobile Scale Down**:
  - Scaled down arrow buttons on mobile (`w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9`) with smaller chevron icons (`w-3.5 h-3.5`).
  - Scaled down text overlays and buttons (`text-sm` heading, `text-[10px]` subtitle, `text-[10px]` CTA button with compact padding `py-1 px-3`).
  - Default mobile aspect ratio set to `16/9` to prevent oversized height on phone screens.
- **Separated Mobile Customizations in CMS Editor**:
  - Split `ImageSliderConfigEditor` layout tab into 3 distinct sections:
    - 🖥️ **Desktop Layout & Sizing**: Aspect Ratio (`21/8`, `21/9`, `16/9`, `3/1`, `4/3`), Border Radius, Horizontal Margin, Top Margin.
    - 📱 **Mobile Layout & Sizing (Separated)**: Mobile Aspect Ratio (`16/9`, `2/1`, `4/3`, `1/1`, `21/9`), Mobile Border Radius, Mobile Horizontal Margin, Mobile Top Margin, Show Navigation Arrows on Mobile switch.
    - ⚙️ **Behavior & Controls**: Auto-play switch, Auto-play interval, Desktop Arrows switch, Dot Pill switch.
- **CSS Variable Responsive Engine**:
  - Slider container dynamically applies CSS variables `--m-top`, `--m-x`, `--d-top`, `--d-x`, `--m-rad`, `--d-rad`, `--m-asp`, `--d-asp` to guarantee fluid zero-layout-shift responsive rendering.

## 1. Phase 4.10 Architecture Changes — PC Header Full-Width Layout & Responsive Spacing

### PC Header Full-Width Responsive Layout (2026-09-11)
- **File**: `src/app/components/Header.tsx`
  - Removed `max-w-7xl` constraint on the main customer header bar to allow it to expand gracefully to full-width across PC viewports.
  - Added responsive left and right container gutters (`px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14`) on the outer wrapper and `px-4 sm:px-6 md:px-8 lg:px-10` on the header pill, giving balanced spacing from the screen edges on wide displays while maintaining the centered oversized circular brand emblem.

## 1. Phase 4.9 Architecture Changes — Cloudinary Media Gallery & Banner Media Picker Integration

### Cloudinary Media Management API Endpoint (2026-09-11)
- **File**: `src/pages/api/media.ts`
  - **GET**: Lists media assets with search (`search`), folder filter (`folder`), pagination (`next_cursor`, `max_results`). Employs Cloudinary Search API with graceful fallback to Admin Resources API. Returns detailed metadata: `public_id`, `format`, `bytes`, `width`, `height`, `url`, `secure_url`, `folder`, `filename`, `created_at`.
  - **POST**: Multi-file and single-file upload handler to Cloudinary folder (`cafe-little-karachi/gallery`).
  - **DELETE**: Single and bulk deletion handler accepting `public_ids: string[]` using `cloudinary.api.delete_resources` / `cloudinary.uploader.destroy`.

### Dedicated Media Gallery Component (2026-09-11)
- **File**: `src/app/components/MediaGallery.tsx`
  - **Grid & Search/Filter**: Thumbnail grid with format filters (`All`, `JPG`, `PNG`, `WEBP`, etc.), real-time keyword search, format badges, and byte size formatter (`formatBytes`).
  - **Upload Engine**: Multi-file upload with progress tracking indicator and auto-refresh.
  - **Bulk Management**: Multi-select mode with selection count bar, Select All Filtered / Deselect All, and bulk delete modal with confirmation.
  - **Side-by-Side Detail Inspection Modal**:
    - **Left**: High-resolution image preview container with checkerboard/dark backdrop and "Open original" external link.
    - **Right**: Rich asset specification panel displaying:
      - Dimensions in pixels (`width × height px`).
      - File size formatted in B/KB/MB.
      - Image format/type badge.
      - Localized upload date/time.
      - Public ID / folder path.
      - Direct Cloudinary URL with 1-click "Copy Link" button (with "Copied!" feedback).
      - Single-item delete button with confirmation dialog.
  - **Picker Mode (`isPicker?: boolean`)**: Allows embedding the gallery inside modals with "Choose & Use This Image" button to pass selected image URLs directly into form fields.

### Admin Dashboard Tab Registration (2026-09-11)
- **File**: `src/app/admin/page.tsx`
  - Added `media` to `TabKey` and registered `{ key: 'media', label: 'Media Gallery', icon: ImageIcon }` in `TABS`.
  - Added `<MediaGallery />` card container rendering when `activeTab === 'media'`.

### Banner & Slider Media Gallery Integration (2026-09-11)
- **File**: `src/app/components/AdminPageBuilder.tsx`
  - **Hero Banner (CMS Mode)**: Added "Gallery" picker button alongside PC Desktop and Mobile banner upload fields.
  - **Image Banner Slider (CMS Mode)**: Added "Gallery" picker buttons for each individual slide's Desktop and Mobile image inputs.
  - **Rich Content Story Row**: Added "Gallery" picker button for story image assets.
  - **Hero Banner (Classic Mode)**: Added "Gallery" picker buttons for Classic mode Desktop and Mobile banner inputs.
  - **Slide Image Picker Modal**: Embedded `<MediaGallery isPicker={true} />` inside responsive modal dialogs to seamlessly select existing assets into banner and slider configurations.

## 1. Phase 4.8 Architecture Changes — Classic Layout Banner Slider Selection & Admin Theme Refactor

### Admin Theme Hook Resolution (2026-09-11)
- **File**: `src/app/admin/page.tsx`
  - **Issue**: `ReferenceError: setTheme is not defined` occurred at lines 518–520 in the Preferences tab because `useTheme` was removed during the previous refactoring.
  - **Fix**: Re-imported `useTheme` from `next-themes` and initialized `const { setTheme } = useTheme();` inside `AdminDashboard`.

### Classic Normal Layout Banner Style Selection (2026-09-11)
- **File**: `src/app/components/AdminPageBuilder.tsx`
  - **Feature**: Added a sleek segmented control to the Classic Mode Top Banner editor allowing administrators to choose between:
    1. **Hero Banner**: Single full-width header with text overlays, CTA buttons, background size, and PC/Mobile image uploads.
    2. **Image Banner Slider**: Multi-slide carousel banner with desktop and mobile image mockups, direct upload/URL inputs, Image Only toggle, per-slide title/subtitle/CTA/opacity/alignment/colors, autoplay, autoplay interval timing, navigation arrows, dot navigation pills, horizontal/top margins, and custom border-radius.
  - **Extracted Component**: Created `ImageSliderConfigEditor` as a reusable subcomponent shared seamlessly between CMS Layout Mode and Classic Normal Layout Mode.
  - **State & Persistence**: Added `classicBannerType` state ('hero' | 'image-slider') loaded from `/api/page-config` and saved on layout update.

### PageConfig Schema & API Updates (2026-09-11)
- **Files**: `src/models/PageConfig.ts`, `src/pages/api/page-config.ts`
  - Added `classicBannerType: { type: String, enum: ['hero', 'image-slider'], default: 'hero' }` to `IPageConfig` interface and `PageConfigSchema`.
  - Updated API handler to accept `classicBannerType` on POST and return it on GET.

### Customer Order Page Rendering Updates (2026-09-11)
- **File**: `src/app/order/page.tsx`
  - Updated `loadPageData` to read `classicBannerType` from the database config.
  - Updated Classic Layout conditional render (`!useCmsLayout`) to display `<BannerSlider section={imageSliderSection} />` when `classicBannerType === 'image-slider'` or `<Hero ... />` when `classicBannerType === 'hero'`.

## 1. Phase 4.7 Architecture Changes — Header UX & Admin Panel Separation

### Header Non-Sticky Layout & Hero Spacing (2026-09-11)
- **File**: `src/app/components/Header.tsx`
  - **Change**: Converted from `fixed top-0 left-0 w-full z-50` (sticky fixed overlay) to in-document-flow `relative w-full z-40` container.
  - **Vertical Padding**: Outer wrapper now has `pt-4 pb-6 md:pt-6 md:pb-8` so the oversized circular brand emblem (up to `w-32 h-32`) has full breathing room above and below without clipping or touching the Hero banner image.
  - **Scroll Animations Removed**: Deleted `useScroll`, `useTransform`, `islandWidth`, `islandY`, and `islandShadow` — these depended on fixed positioning and are irrelevant in normal flow.
  - **Admin Exclusion**: Added `usePathname` + early return `null` guard when `pathname?.startsWith('/admin')` so this component never renders inside the admin dashboard.
  - **Tag change**: `<motion.header>` replaced with plain `<header>` (framer-motion `motion.` prefix no longer needed since scroll transforms are gone).

### Footer & WhatsApp Button Admin Exclusion (2026-09-11)
- **Files**: `src/app/components/Footer.tsx`, `src/app/components/WhatsAppButton.tsx`
  - Added `usePathname` import and `if (pathname?.startsWith('/admin')) return null` guard in each component so the customer footer and floating WhatsApp CTA are completely suppressed on all `/admin/*` routes.

### globals.css — Legacy .fixed Hack Removed (2026-09-11)
- **File**: `src/app/globals.css`
  - **Removed**: `@media (max-width: 768px) { .fixed { bottom: 0; } }` — this was a leftover workaround that incorrectly anchored ALL `position: fixed` elements to the bottom on mobile, breaking modals, cart sidebars, the RestaurantStatusPopup, and WhatsApp floating button.

### Dedicated AdminHeader Component (2026-09-11)
- **New File**: `src/app/components/AdminHeader.tsx`
  - **Aesthetics**: Frosted glass (`bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl`), 64px height, `sticky top-0 z-30`.
  - **Left Section**: Mobile drawer toggle, `CLK Admin` shield breadcrumb badge (plum on light / amber on dark), active tab icon + label, pulsing `System Live` dot pill (desktop).
  - **Right Section**: Live digital clock with seconds + date (xl only), interactive audio alert pill (click-to-enable when off, click-to-test-chime when on), `Live Store` link (opens customer storefront in new tab), light/dark theme toggle, `Lock Workspace` `LogOut` button with rose hover.
  - **Props**: `activeTabLabel`, `activeTabIcon`, `setIsMobileSidebarOpen`, `audioInitialized`, `onToggleAudio`, `onTestSound`, `onLogout`.

### admin/page.tsx Refactoring (2026-09-11)
- **File**: `src/app/admin/page.tsx`
  - Removed `useTheme`, `LogOut`, `Sun`, `Moon`, `MenuIcon`, `Volume2`, `VolumeX` imports (now owned by `AdminHeader`).
  - Removed `systemTime` state and its `setInterval` timer effect (now owned by `AdminHeader`).
  - Removed old inline `<header>` block containing the generic breadcrumb + audio pill + clock + dark mode toggle.
  - Imported and rendered `<AdminHeader ... />` with all required props wired to existing state and handlers.

## 1. Active Architecture Decisions (Phase 4.5)

### Site-Wide Clean URL Engine
- **Root Main Menu (`/`)**: Main catalog hosted directly on root `/`.
- **Order State Persistence**: `OrderContext.tsx` maintains state in memory, synchronized with both `localStorage` (`order-context`) and first-party Cookies (`CLK_ORDER_TYPE`, `CLK_AREA`, `CLK_TABLE`).
- **Dynamic Entrypoint Routes**:
  - `/item/[slug]` ➔ Opens single item customization modal over main menu.
  - `/platter/[slug]` ➔ Opens platter customization modal over main menu.
  - `/table/[tableId]` ➔ Sets dine-in table in persistent context and cleans URL to `/`.
  - `/delivery/[area]` ➔ Sets delivery area in persistent context and cleans URL to `/`.
- **Header Location Pill**: Header location icon triggers `OrderTypeModal` (managed globally via `OrderContext.isLocationModalOpen`) so users can update mode/location anytime.
- **Modal Performance Optimization**: Opening item/platter modals synchronizes URLs asynchronously via `requestAnimationFrame` with `replaceState`, utilizes GPU layer compositing (`willChange`), and caches platter category queries to ensure instantaneous 60fps open/close animations.
- **Order Placement Robustness**: Handled operating hours check for dev testing, ensured fallback context resolution (`area`, `tableId`, `ordertype`) on `newOrder` payloads, wired granular validation error descriptions directly into checkout toast feedback, and cleaned `/thank-you` redirection to concise parameter URLs (`/thank-you?type=delivery&order=${orderNumber}`) with fallback navigation resilience.
- **Micro-Fix: Multi-Source Thank-You Page Resolution (`src/app/thank-you/page.tsx`)**: Resolved `⚠️ Order number missing in URL` by adding multi-layered fallback across `?order=...`, `?orderNumber=...`, `?id=...`, and `localStorage.getItem('latest_order_number')`.
- **Micro-Fix: Admin OrdersList Parsing & Polling Frequency (`src/app/components/OrdersList.tsx`)**: 
  - Fixed array extraction bug where `data.orders` evaluated to `undefined` on endpoints returning bare JSON arrays (`newOrders = Array.isArray(data) ? data : data.orders || []`).
  - Relaxed background polling interval from 5 seconds to **2 minutes (120,000ms)**.
  - Added dedicated **\"Refresh Orders\" button** with live `RefreshCw` spin animation for on-demand synchronization.
- **Micro-Fix: Platter Direct URL Order-Type Popup Sequencing (`OrderContext.tsx`, `PlatterItem.tsx`, `AddToCartButtonForPlatters.tsx`)**:
  - **Problem**: New users opening `/platter/[slug]` directly saw the order-type popup before the platter product modal (auto-fired by `OrderContext` on mount when no persisted order found).
  - **Fix**: `OrderContext.tsx` now suppresses `isLocationModalOpen` auto-open when pathname starts with `/platter/` or `/item/`. `PlatterItem.tsx` uses `useOrder` + `useCart` directly; "Add to Cart" checks `isLocationSet` — if not set, queues the cart item in a `pendingCartItem` ref and opens the location modal. A `useEffect` flushes the queued add once `isLocationSet` goes `false→true`. Closing the platter modal with ✕ without adding also triggers `setLocationModalOpen(true)` via a 200ms defer. `AddToCartButtonForPlatters.tsx` now calls `onAddRequest()` prop instead of `addToCart` directly.
- **Micro-Fix: Direct URL Modal Auto-Open for Platter and Item Routes (`PlatterItem.tsx`, `MenuItem.tsx`)**:
  - **Problem**: Entering `/platter/[slug]` or `/item/[slug]` directly in the browser (hard navigation) did not reliably open the product modal. Progressive async item loading caused `initialOpen` prop timing to be unreliable — items load with random delays so the matching item's `initialOpen=true` could arrive too late or be missed during remounts.
  - **Fix**: Added a URL-pathname-based `useEffect` to both `PlatterItem.tsx` and `MenuItem.tsx`. On mount, each component checks if `window.location.pathname` matches its own slug. If it does, `setShowModal(true)` is called immediately, independent of the `initialOpen` prop. This is a complementary fallback — `initialOpen` prop still works for programmatic opens; URL check ensures hard navigations always work.
- **Micro-Fix: Order-Type Selection Cart Reset & Persistence (`src/app/context/CartContext.tsx`)**:
  - **Problem**: When a user without an order type selected clicked "Add to Cart" on a platter, selected an order type in `TableForm`, the green "Added to cart" message flashed, but the cart remained empty (0 items).
  - **Root Cause**: `CartContext` dynamically computed `storageKey` based on `orderType` and `tableId`/`area` (`cart-${orderType}-${safeId}`). When the order type was confirmed, `OrderContext` updated `orderType` from `""` to `"dinein"`, changing `storageKey` to `"cart-dinein-5"`. An effect in `CartContext` listening to `[storageKey]` fired and read `localStorage.getItem("cart-dinein-5")` (which was empty `null`) and executed `setCartItems([])`, clobbering the pending cart add from `PlatterItem` and wiping out the cart.
  - **Fix**: Standardized `CartContext` to use a stable persistent storage key (`clk_cart`) across the entire session so items are preserved across order mode / table changes, with derived `totalAmount` via `useMemo` for instant synchronicity and legacy `cart-*` key migration on mount.
- **Micro-Fix: Unblock "Add to Cart" During Off-Hours (`src/app/components/AddToCartButton.tsx`)**:
  - **Problem**: When customers visited before 6:30 PM, menu item customization buttons displayed "Closed (Opens 6:30 PM)" and blocked adding items to cart with error toasts, preventing daytime browsing and cart preparation.
  - **Fix**: Removed the `isOpenAt()` check and disabled state from `AddToCartButton.tsx` (aligning it with `AddToCartButtonForPlatters.tsx`). Customers can now seamlessly customize and add items to their cart anytime.
- **Micro-Fix: Desktop & Mobile Header Layout Alignment (`src/app/components/Header.tsx`)**:
  - **Changes**:
    1. **Left Side**: Moved the Location Pill to the left side and placed the "Call Us" contact pill right next to it in a unified left action cluster.
    2. **Right Side**: Positioned the "My Order" Cart button alongside a new dedicated Hamburger menu icon button.
    3. **Slide-over Navigation Drawer**: Enhanced the slide-over menu drawer with smooth backdrop blur, brand logo header, quick links (Menu Catalog, Change Dining Mode / Location, Map, WhatsApp, Direct Call), and operating hours footer.
- **Micro-Fix: Global Link Hover Contrast & Drawer Item Badges (`src/app/globals.css`, `src/app/components/Header.tsx`)**:
  - **Problem**: Global `a:hover, a:focus` in `globals.css` forced `color: #741052` (dark plum) and underline, making hovered links in the dark sidebar drawer (`#5c0d40`), header, and footer blend invisibly into dark backgrounds.
  - **Fix**: Removed destructive `color: #741052` from global `a:hover` in `globals.css`. Redesigned sidebar drawer navigation items with high-contrast icon badge containers (`w-9 h-9 bg-white/10 text-[#ff9824]`), bold legible white typography, `hover:bg-white/20`, border highlights, amber hover transitions (`hover:text-amber-200`), and smooth arrow micro-interactions.
- **Micro-Fix: HD Logo Rollout & Oversized Circular Header Emblem (`src/app/components/Header.tsx`, `src/app/components/Footer.tsx`, `src/app/components/MaintenanceScreen.tsx`)**:
  - **HD Logo Asset**: Replaced `/butter-paper1.webp` with high-definition `/hd-logo.webp` across Header, Sidebar Drawer, Footer, and Maintenance Screen.
  - **Oversized Circular Emblem**: In the desktop Header, enclosed `/hd-logo.webp` in a circular badge (`w-28 h-28 lg:w-32 lg:h-32`) rendered with the header background color (`bg-[#5c0d40]`), border (`border-[3px] border-white/25`), deep drop-shadow (`shadow-[0_10px_35px_rgba(0,0,0,0.55)]`), and ambient amber halo glow (`bg-[#ff9824]/20 blur-2xl`), extending elegantly above and below the header bar without clipping.
- **Micro-Fix: Compact Bottom-Right Browse-Mode Banner (`src/app/components/RestaurantStatusPopup.tsx`)**:
  - **Problem**: The "View Only Menu Mode" top banner that appeared when customers clicked "View Menu (Browse Only)" during off-hours was a very wide, center-top floating bar that felt intrusive and too large.
  - **Fix**: Replaced the wide `top-20 left-1/2 max-w-2xl` top banner with a compact `bottom-5 right-4` floating toast (`w-[clamp(200px,88vw,280px)]`). The new design shows a pulsing amber dot, "Browse Only · Opens 6:30 PM" label, the live countdown timer (`HH:MM:SS`), and a small "Timer" button to re-open the full modal — all in a tight dark pill on the bottom-right that doesn't obstruct the menu.
- **Micro-Fix: Remove Visible Noscript Banner from MetaPixelProvider (`src/app/providers/MetaPixelProvider.tsx`)**:
  - **Problem**: In Next.js App Router, `<noscript>` inside a `'use client'` component is hydrated as normal DOM — React renders the inner `<img height="1" width="1">` as a fully visible element on the page, producing a mysterious small image/box that looks like an old banner stub.
  - **Fix**: Removed the `<noscript>` fallback block entirely. Next.js always runs with JavaScript, so the noscript fallback is completely redundant. The `<Script strategy="afterInteractive">` pixel already handles 100% of users.
- **Feature: Image Banner Slider + Admin Page Builder Revamp (`src/app/components/BannerSlider.tsx`, `src/app/components/AdminPageBuilder.tsx`, `src/order/page.tsx`, `src/models/PageConfig.ts`)**:
  - **New `image-slider` section type**: Added to MongoDB `PageConfig` schema, `AdminPageBuilder.tsx` section preset list, `order/page.tsx` renderer, and the `PageSection` TypeScript type union across all relevant files.
  - **`BannerSlider.tsx`** (new client component): Full-width image carousel with configurable outer margin (`marginX`, `marginTop`), `border-radius` (default 20px), CSS-transform slide transitions (500ms ease-out), left/right `ChevronLeft`/`ChevronRight` arrow buttons inside the slider, animated bottom dot-navigation pill inside the slider, autoplay with pause-on-hover, touch swipe support, and per-slide optional text overlay (title, subtitle, CTA button, overlay opacity, text colour, alignment). Falls back gracefully to desktop image if no mobile image provided.
  - **Image-Only Slide Mode (`imageOnly?: boolean`)**: Added an explicit "Image Only" toggle per slide. When enabled, all text overlays, button CTAs, and dark background gradients are completely skipped on the frontend, and the corresponding input fields are collapsed in the admin editor, rendering a clean, pure graphical banner without obstruction.
  - **Admin Editor Preset Exposure Fix (`AdminPageBuilder.tsx`)**: Fixed the category filtering array in the "Layout Sections" sidebar (`types: ["hero", "banner", "image-slider"]`), resolving the issue where "Image Banner Slider" was excluded from the "Header & Banners" category and not visible to admins.
  - **Dual Layout Mode Support (`order/page.tsx`)**: Rendered `BannerSlider` in both Advanced CMS mode and Classic Layout mode (`!useCmsLayout`), ensuring the animated banner slider immediately displays at the top of the ordering page whenever an `image-slider` section is active, even if the store is running in Classic category list mode.
  - **Admin Editor** (`AdminPageBuilder.tsx`): Added new editor panel under section type `image-slider` with two tabs — **Slides** (per-slide desktop/mobile image upload with browser + phone mockup previews, live Cloudinary upload via `/api/upload`, imageOnly toggle, title/subtitle/CTA text/CTA link/overlay opacity/text colour/alignment inputs, add/remove slide buttons, empty-state placeholder) and **Layout & Behaviour** (autoPlay toggle, interval ms, showArrows, showDots, borderRadius, marginX, marginTop inputs). Added `GalleryHorizontal` icon import, `sliderTab` state, `uploadingSlides` state, `addSlide`/`removeSlide`/`updateSlide`/`handleSlideImageUpload` helpers, `BannerSlide` interface export, and sky-blue theme colour for the section type badge.
- **Phase 4.6 Meta Pixel & Conversions API (CAPI) Integration (`src/lib/metaCapi.ts`, `src/app/lib/metaPixel.ts`, `src/app/providers/MetaPixelProvider.tsx`, `src/pages/api/orders.ts`, `src/pages/api/analytics/meta-capi.ts`, `src/app/lib/analytics.ts`)**:
  - **Meta Pixel**: Integrated Pixel ID `1619761243277122` via `<MetaPixelProvider />` in `src/app/layout.tsx` with dynamic page view tracking on route transitions.
  - **Meta Conversions API (CAPI)**: Built robust server-side CAPI client (`src/lib/metaCapi.ts`) supporting SHA-256 PII hashing (email, Pakistani mobile phone normalization `03...` ➔ `923...`), client IP, User-Agent, and `_fbp`/`_fbc` cookie extraction.
  - **Purchase Server-Side Dispatch**: Wired asynchronous, non-blocking CAPI `Purchase` event dispatch directly into `src/pages/api/orders.ts` on MongoDB order creation.
  - **Event Deduplication**: Shared `event_id: orderNumber` between client-side Meta Pixel and server-side CAPI to guarantee zero duplicate conversion counts in Meta Events Manager.
  - **Full 10 Meta Standard Events Rollout**:
    1. `ViewContent`: Fired on item / platter detail modal view (`trackMetaViewContent`).
    2. `CustomizeProduct`: Fired on variation selection, add-on picks, and platter choices in `MenuItem.tsx` and `PlatterItem.tsx` (`trackMetaCustomizeProduct`).
    3. `AddToCart`: Fired when items or platters are added to the cart (`trackMetaAddToCart`).
    4. `InitiateCheckout`: Fired when opening cart drawer or checkout page (`trackMetaInitiateCheckout`).
    5. `AddPaymentInfo`: Fired when toggling payment method (Cash vs Online) with order amount & item count in `checkout/page.tsx` (`trackMetaAddPaymentInfo`).
    6. `Purchase`: Fired on thank-you page with deduplication against server CAPI (`trackMetaPurchase`).
    7. `Contact`: Fired on clicking desktop Call Us pill, mobile WhatsApp icon, sidebar drawer call/WhatsApp links, and footer contact link (`trackMetaContact`).
    8. `FindLocation`: Fired on submitting dining mode / delivery area / table number in `TableForm.tsx` and clicking Google Maps directions in drawer (`trackMetaFindLocation`).
    9. `Search`: Fired on menu/catalog queries (`trackMetaSearch`).
    10. `Lead`: Fired on submitting customer rating/feedback in `thank-you/page.tsx` (`trackMetaLead`).
  - **Unified Analytics Bridge**: Updated `src/app/lib/analytics.ts` so `trackEvent` automatically fans out to Meta Pixel (`fbqTrack`), Microsoft Clarity, and internal analytics.
  - **Server-Side CAPI Support**: Expanded `SendMetaCapiEventOptions.eventName` union type in `src/lib/metaCapi.ts` to include all standard events.

---


## 2. Key Files Modified / Created

| File | Type | Purpose |
| :--- | :--- | :--- |
| `src/lib/metaCapi.ts` | Backend Utility | Meta Conversions API (CAPI) client with SHA-256 PII hashing & Graph API v21.0 integration |
| `src/app/lib/metaPixel.ts` | Frontend Utility | Meta Pixel typed helpers (`trackMetaPageView`, `trackMetaViewContent`, `trackMetaAddToCart`, `trackMetaInitiateCheckout`, `trackMetaPurchase`) |
| `src/app/providers/MetaPixelProvider.tsx` | UI Provider | Meta Pixel script injection, `<noscript>` fallback, and route transition PageView watcher |
| `src/pages/api/analytics/meta-capi.ts` | API Route | Serverless endpoint for relaying client events to Meta CAPI with IP and cookie enrichment |
| `src/pages/api/orders.ts` | API Route | Fires server-side CAPI `Purchase` event with `eventId: orderNumber` on order creation |
| `src/app/lib/analytics.ts` | Analytics Bridge | Connects `trackEvent` to Meta Pixel e-commerce events |
| `src/app/layout.tsx` | Root Layout | Mounts `<MetaPixelProvider />` globally |
| `.env` & `.env.production` | Environment | Configured `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, and `META_CONVERSIONS_API_TOKEN` |
| `src/app/context/OrderContext.tsx` | Core Context | Dual persistence (localStorage + Cookies), legacy query param migration, modal open/close triggers |
| `src/app/lib/slugify.ts` | Utility | Slug generation and item/platter lookup helpers |
| `src/app/page.tsx` | Root Page | Hosts full ordering catalog directly at `/` |
| `src/app/order/page.tsx` | Page Component | Main menu engine + client redirect from `/order` to `/` |
| `src/app/item/[slug]/page.tsx` | Dynamic Route | Ad campaign product entrypoint |
| `src/app/platter/[slug]/page.tsx` | Dynamic Route | Ad campaign platter entrypoint |
| `src/app/table/[tableId]/page.tsx` | Dynamic Route | Clean QR code dine-in entrypoint |
| `src/app/delivery/[area]/page.tsx` | Dynamic Route | Clean delivery area share link entrypoint |
| `src/app/components/Header.tsx` | UI Component | MapPin opens location modal, displays active location pill tag, clean links |
| `src/app/components/TableForm.tsx` | UI Modal | OrderTypeModal hooked into OrderContext with close button and pre-filled inputs |
| `src/app/components/MenuItem.tsx` | UI Component | `/item/[slug]` history push on modal open, popstate listener |
| `src/app/components/PlatterItem.tsx` | UI Component | `/platter/[slug]` history push on modal open, popstate listener |
| `src/app/components/CartSidebar.tsx` | UI Component | Clean `/checkout` navigation without query parameters |
| `src/app/checkout/page.tsx` | Checkout Page | Reads order mode/location directly from OrderContext, stores `latest_order_number` to localStorage on order placement |
| `src/app/thank-you/page.tsx` | Thank You Page | Resilient multi-source order resolution (`order`/`orderNumber`/`id`/localStorage) |
| `src/app/components/OrdersList.tsx` | UI Component | Admin order list with universal array parsing, 2m interval, and manual refresh button |
| `src/app/providers/PostHogProvider.tsx` | Analytics | Supports clean routes and persisted location context |
| `src/app/components/BannerSlider.tsx` | UI Component | **[NEW]** Image carousel with inner arrows, dot pill, autoplay, touch swipe, per-slide overlays |
| `src/app/components/AdminPageBuilder.tsx` | Admin Panel | Added `image-slider` type editor: per-slide upload, overlay config, layout tab |
| `src/models/PageConfig.ts` | Mongoose Model | Added `'image-slider'` to section type enum |
