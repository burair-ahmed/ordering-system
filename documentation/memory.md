---
title: "Living Project Memory & Task Tracker — Advanced Ordering Ecosystem"
tags:
  - #type/memory
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-04
---

# Living Project Memory & Task Tracker

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
- **Phase 4.6 Meta Pixel & Conversions API (CAPI) Integration (`src/lib/metaCapi.ts`, `src/app/lib/metaPixel.ts`, `src/app/providers/MetaPixelProvider.tsx`, `src/pages/api/orders.ts`, `src/pages/api/analytics/meta-capi.ts`, `src/app/lib/analytics.ts`)**:
  - **Meta Pixel**: Integrated Pixel ID `1619761243277122` via `<MetaPixelProvider />` in `src/app/layout.tsx` with dynamic page view tracking on route transitions and `<noscript>` fallback.
  - **Meta Conversions API (CAPI)**: Built robust server-side CAPI client (`src/lib/metaCapi.ts`) supporting SHA-256 PII hashing (email, Pakistani mobile phone normalization `03...` ➔ `923...`), client IP, User-Agent, and `_fbp`/`_fbc` cookie extraction.
  - **Purchase Server-Side Dispatch**: Wired asynchronous, non-blocking CAPI `Purchase` event dispatch directly into `src/pages/api/orders.ts` on MongoDB order creation.
  - **Event Deduplication**: Shared `event_id: orderNumber` between client-side Meta Pixel and server-side CAPI to guarantee zero duplicate conversion counts in Meta Events Manager.
  - **Unified Analytics Bridge**: Updated `src/app/lib/analytics.ts` so all journey events (`ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) automatically fan out to Meta Pixel, Microsoft Clarity, and internal analytics.
  - **API Relay Endpoint**: Created `/api/analytics/meta-capi.ts` for relaying client conversion events to CAPI.

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
