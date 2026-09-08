---
title: "Project Status Dashboard — Advanced Ordering Ecosystem"
tags:
  - #type/status
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-04
overall_completion: "Phase 4.5: Site-Wide Clean URL Architecture Completed (100%)"
current_sprint: "Site-Wide Clean URL Architecture & Frictionless Ordering"
---

# Project Status Dashboard — Advanced Ordering Ecosystem

## Sub-Project Status Matrix

| Sub-Project | Phase | Focus | Status |
| :--- | :--- | :--- | :--- |
| **Cafe Little Karachi (CLK)** | Phase 4.6 | Meta Conversions API (CAPI) & Meta Pixel Integration | **Completed** 🟢 |
| **The Chai Company (TCC)** | Base | Monorepo Structure | Ready for Next Cycle ⚪ |

---

## Phase 4.6 Completion Summary — Meta Conversions API (CAPI) & Meta Pixel Integration

- [x] **Meta Pixel Provider (`MetaPixelProvider.tsx`)**: Injected Meta Pixel (ID: `1619761243277122`) with Next.js Script strategy `afterInteractive`, `<noscript>` tracking fallback, and route transition `PageView` tracking.
- [x] **Meta Conversions API (CAPI) Server Engine (`metaCapi.ts`)**: Built server-side CAPI engine with SHA-256 PII hashing (email, Pakistani mobile phone normalization `03...` ➔ `923...`), client IP, User-Agent, and `_fbp`/`_fbc` cookie extraction.
- [x] **Zero-Loss Purchase Event Tracking (`orders.ts`)**: Asynchronously fires CAPI `Purchase` event directly upon order creation in MongoDB, ensuring 100% conversion capture even when client ad-blockers are active.
- [x] **Event Deduplication (`event_id`)**: Shared `event_id: orderNumber` between client-side Meta Pixel and server-side CAPI to guarantee zero duplicate conversion counts in Meta Events Manager.
- [x] **Unified Analytics Bridge (`analytics.ts`)**: Wired `trackEvent` to automatically fan out e-commerce journey events (`ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) to Meta Pixel, Microsoft Clarity, and internal analytics.
- [x] **CAPI Relay API Endpoint (`/api/analytics/meta-capi`)**: Serverless endpoint for forwarding frontend funnel events to CAPI.
- [x] **Verified Connectivity**: Tested and confirmed live Meta Graph API acceptance with `events_received: 1`.
- [x] **Off-Hours Cart Addition Enabled (`AddToCartButton.tsx`)**: Removed `isOpenAt()` blocker from individual menu items, allowing customers to freely browse, customize, and add items to their cart before opening hours.
- [x] **Header Layout Modernization (`Header.tsx`)**: Reordered desktop/mobile header to place Location and Contact pills on the left side, with Cart and a new Hamburger Menu Sidebar icon on the right side.
- [x] **Global Hover Contrast & Drawer Links Overhaul (`globals.css`, `Header.tsx`)**: Eliminated destructive global `a:hover` color overrides that caused dark links on dark backgrounds, and styled sidebar drawer items with dedicated high-contrast icon badges, clear white typography, and amber glow hover states.
- [x] **HD Logo & Oversized Circular Header Emblem (`Header.tsx`, `Footer.tsx`, `MaintenanceScreen.tsx`)**: Upgraded to `/hd-logo.webp` across the entire app and framed the desktop header logo in a circular badge (`w-28 h-28 lg:w-32 lg:h-32`) with the header plum color (`bg-[#5c0d40]`), border, drop shadow, and halo glow that extends prominently beyond the header bar.

---

## Phase 4.5 Completion Summary — Site-Wide Clean URL Architecture

- [x] **Root Menu Domain (`/`)**: Main catalog hosted directly on root domain `/` without requiring subpaths.
- [x] **Zero Query Parameters**: Query strings (`?type=...`, `?area=...`, `?tableId=...`) eliminated across the entire user experience.
- [x] **Dual Persistence Engine (`OrderContext.tsx`)**: Location, order mode, and table ID persisted via `localStorage` + Cookies (`CLK_ORDER_TYPE`, `CLK_AREA`, `CLK_TABLE`).
- [x] **Ad Campaign Routes (`/item/[slug]`, `/platter/[slug]`)**: Clean ad URLs that open product modals immediately over the menu.
- [x] **Dine-In QR & Area Share Routes (`/table/[tableId]`, `/delivery/[area]`)**: Clean entrypoints that absorb parameters into persistent context and silently normalize address bar to `/`.
- [x] **Header Location Control (`Header.tsx`)**: Header MapPin opens `OrderTypeModal` allowing customers to update location/mode at any time, with live location pill indicator.
- [x] **Modal URL Sync (`MenuItem.tsx`, `PlatterItem.tsx`)**: Modals push `/item/[slug]` or `/platter/[slug]` to browser history and cleanly revert to `/` on close or back button.
- [x] **Legacy URL Migration**: Automatic client-side absorption and silent URL cleanup for legacy bookmarked query-parameter links.
- [x] **Resilient Thank-You Page Resolution (`/thank-you`)**: Multi-layered order lookup across `order`/`orderNumber`/`id` search params, `localStorage`, and session context, preventing missing order number errors.
- [x] **Admin OrdersList Polling & Manual Refresh (`OrdersList.tsx`)**: Fixed array parsing for `/api/orders`, optimized polling interval to 2 minutes (120s), and added a dedicated manual refresh button with live loading state.
- [x] **Platter Direct URL UX — Deferred Order-Type Popup (`OrderContext.tsx`, `PlatterItem.tsx`, `AddToCartButtonForPlatters.tsx`)**: Suppressed auto-open of order-type modal on `/platter/*` and `/item/*` entrypoint routes. Platter modal now opens immediately. "Add to Cart" on a new user (no order type set) triggers the popup and queues the pending cart add — auto-flushed after order type selection. Closing the platter modal without adding also triggers the popup.
- [x] **Direct URL Hard Navigation Modal Auto-Open (`PlatterItem.tsx`, `MenuItem.tsx`)**: Added `window.location.pathname` check on mount to both components. When the URL already matches the item slug (hard navigation), the modal opens immediately regardless of prop timing from progressive async loading.
- [x] **Order-Type Popup Z-Index Fix (`TableForm.tsx`)**: Raised `TableForm` z-index from `z-50` → `z-[200]` so the order-type selection modal always renders above the item/platter modals (`z-50`) when triggered from inside them.
- [x] **Cart Context Persistence Across Order-Type Selection (`CartContext.tsx`)**: Unified cart storage to stable persistent key (`clk_cart`) with derived `totalAmount` calculation. Fixed bug where changing order type from unset to dine-in/delivery reset `storageKey` and wiped the cart to empty array. Pending and added items now persist seamlessly.
- [x] **Header "Call Us" Pill Design Alignment (`Header.tsx`)**: Re-styled desktop "Call Us" to be 100% identical to the Location pill in height, rounded pill shape, glassmorphism border/background, tap micro-animations, and typography.
