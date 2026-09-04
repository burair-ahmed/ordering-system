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
| **Cafe Little Karachi (CLK)** | Phase 4.5 | Site-Wide Clean URL Architecture & Context Persistence | **Completed** 🟢 |
| **The Chai Company (TCC)** | Base | Monorepo Structure | Ready for Next Cycle ⚪ |

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
