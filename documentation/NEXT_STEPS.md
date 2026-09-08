---
title: "Next Steps & Handoff Guide — Advanced Ordering Ecosystem"
tags:
  - #type/handoff
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-04
---

# Next Steps & Handoff Guide — Advanced Ordering Ecosystem

## Completed in Current Sprint
- [x] **Phase 4.6 Meta Pixel & Conversions API (CAPI) Integration**:
  - Injected Meta Pixel (ID: `1619761243277122`) across all pages with automated route transition `PageView` tracking.
  - Built server-side CAPI client (`src/lib/metaCapi.ts`) with SHA-256 PII hashing (email, phone), client IP, User-Agent, and cookie enrichment.
  - Linked server-side `Purchase` event directly in `src/pages/api/orders.ts` on order creation with deduplication `event_id`.
  - Wired full funnel e-commerce events (`ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) through unified analytics bridge (`src/app/lib/analytics.ts`).
  - Added CAPI proxy endpoint `/api/analytics/meta-capi`.
- [x] **Phase 4.5 Site-Wide Clean URL Architecture & Production Hardening**:
  - Implemented dual persistence (`localStorage` + Cookies) via `OrderContext`.
  - Upgraded root domain `/` to host main catalog and Hero.
  - Added clean dynamic campaign routes: `/item/[slug]`, `/platter/[slug]`, `/table/[tableId]`, `/delivery/[area]`.
  - Connected Header `MapPin` icon to open the location selector modal (`OrderTypeModal`) for on-demand location editing.
  - Linked `MenuItem` and `PlatterItem` modals to `history.pushState` (`/item/[slug]` & `/platter/[slug]`).
  - Removed all query string parameters from Cart, Checkout, and Header.
  - **Thank-You Page Fallback**: Multi-source resolution (`order`, `orderNumber`, `id`, `localStorage`) preventing missing order errors.
  - **Admin OrdersList Optimizations**: Universal response parsing (`Array.isArray`), 2-minute polling interval, and manual "Refresh Orders" button.

## Recommended Immediate Next Steps
1. **Ad Campaign Testing**:
   - Test ad links with marketing slugs (`/item/special-chicken-karahi`, `/platter/family-feast`) on live devices.
2. **Physical Table QR Code Rollout**:
   - Generate updated QR codes pointing directly to `cafelittlekarachi.com/table/[tableId]` for dine-in tables.
3. **The Chai Company (TCC) Parity**:
   - Apply clean URL architecture patterns to `the-chai-company/` quick-service platform.
