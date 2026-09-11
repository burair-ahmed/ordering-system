---
title: "Next Steps & Handoff Guide — Advanced Ordering Ecosystem"
tags:
  - #type/handoff
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-11
---

# Next Steps & Handoff Guide — Advanced Ordering Ecosystem

## Completed in Current Sprint
- [x] **PC Header Full-Width Responsive Layout (CLK)**:
  - Removed `max-w-7xl` constraint on the main header, allowing it to stretch full-width on PC displays.
  - Added responsive left and right container gutters (`px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14`) on the outer wrapper and `px-4 sm:px-6 md:px-8 lg:px-10` on the header pill for spacing from the screen edges.
- [x] **Cloudinary Media Gallery & Banner Gallery Picker Integration (CLK)**:
  - Built `/api/media` backend API for Cloudinary listing, Search API integration, pagination, multi-file upload, and bulk/single deletion.
  - Created `MediaGallery.tsx` with thumbnail grid, real-time keyword search, format filter badges, upload dropzone/button with progress state, and bulk deletion workflow.
  - Built side-by-side Image Detail Inspection Modal (Large image preview on left, pixel dimensions, formatted file size in B/KB/MB, format badge, upload timestamp, public ID path, Cloudinary URL with 1-click copy button, and single delete button on right).
  - Added `Media Gallery` tab to `src/app/admin/page.tsx` sidebar navigation with `ImageIcon`.
  - Added "Gallery" picker buttons across `AdminPageBuilder.tsx` for Hero Banner (Desktop & Mobile), Image Banner Slider (per-slide Desktop & Mobile), and Classic mode Hero Banner, allowing administrators to pick from existing Cloudinary media or upload new ones.
- [x] **Admin Theme & Classic Layout Banner Customizations (CLK)**:
  - Fixed `ReferenceError: setTheme is not defined` in `admin/page.tsx` by properly importing `useTheme` from `next-themes` and instantiating `const { setTheme } = useTheme()`.
  - Added option to select between **Hero Banner** and **Image Banner Slider** in Classic Normal Layout mode (`/order` Order Page CMS tab in admin dashboard).
  - Extracted reusable `ImageSliderConfigEditor` component supporting full multi-slide customization: per-slide desktop and mobile browser/phone mockup previews, direct upload & URL input, pure image vs text overlay toggle, slide headings, subtitles, CTA button links, overlay opacity, text color & alignment, autoplay with interval timing, navigation arrows, dot navigation pills, horizontal/top margins, and border-radius.
  - Updated `PageConfig` Mongoose model and `/api/page-config` backend endpoint to persist `classicBannerType: 'hero' | 'image-slider'`.
  - Updated `order/page.tsx` to read `classicBannerType` and render `<BannerSlider />` or `<Hero />` with identical settings and customizations in Classic Layout mode.
- [x] **Header Non-Sticky Layout & Hero Spacing Fix (CLK)**:
  - Removed `fixed` positioning from customer `Header.tsx`. Header now renders in normal document flow with `px-3 sm:px-6 pt-4 pb-6 md:pt-6 md:pb-8` vertical padding so the oversized circular brand emblem never overlaps the Hero section.
  - Removed `useScroll` / `useTransform` scroll-driven width contraction and Y offset animations that were tied to the sticky/fixed layout.
  - Removed hazardous legacy `@media (max-width: 768px) { .fixed { bottom: 0; } }` rule from `globals.css` that was corrupting `fixed` overlays and modals on mobile.
  - Added `usePathname` guard to `Header.tsx`, `Footer.tsx`, and `WhatsAppButton.tsx` so all three customer-facing components immediately return `null` on any `/admin/*` route.
  - Created dedicated `AdminHeader.tsx` component with specialized admin dashboard styling: CLK Admin breadcrumb badge, active tab icon + label, pulsing **System Live** indicator, live digital clock with seconds (xl desktop), interactive audio alert pill (enable or test chime), **Live Store** quick link (opens storefront in new tab), theme toggle (sun/moon), and **Lock Workspace** button.
  - Wired `AdminHeader` into `admin/page.tsx`, replacing the old generic inline `<header>` block and removing the now-redundant duplicate dark mode toggle, systemTime clock state, and timer effect.
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
