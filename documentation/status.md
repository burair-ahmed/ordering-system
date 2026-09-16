---
title: "Project Status Dashboard — Advanced Ordering Ecosystem"
tags:
  - #type/status
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-15
overall_completion: "Phase 4.20: Delivery Charges Resolution & Area Selection (100%)"
current_sprint: "Delivery Charges Resolution & Accurate Funnel Calculations"
---

# Project Status Dashboard — Advanced Ordering Ecosystem

## Sub-Project Status Matrix

| Sub-Project | Phase | Focus | Status |
| :--- | :--- | :--- | :--- |
| **Cafe Little Karachi (CLK)** | Phase 4.20 | Delivery Charges Resolution & Area Selector | **Completed** 🟢 |
| **The Chai Company (TCC)** | Base | Monorepo Structure | Ready for Next Cycle ⚪ |

---

## Phase 4.20 Completion Summary — Delivery Charges Resolution & Accurate Funnel Calculations

- [x] **Resilient Multi-Tier Area Matching (`checkout/page.tsx`)**: Created multi-level area lookup (`findMatchingArea`) matching exact name, case-insensitive, punctuation/dash-free, and substring inclusion against database delivery areas (`/api/delivery-areas`).
- [x] **Checkout Delivery Area Selector & Street Address Split (`checkout/page.tsx`)**: Built a dedicated Delivery Area / Zone selector dropdown displaying all 46 active delivery zones with charge badges (`Rs. 380`, `Rs. 250`, etc.) paired with an independent Street/House Address input.
- [x] **Real-Time Delivery Charges Calculation (`checkout/page.tsx`)**: `deliveryCharge` and `finalAmount` dynamically compute and update in real-time on area selection and order mode changes.
- [x] **Order Summary & Confirmation Modal Alignment (`checkout/page.tsx`)**: Sidebar and confirmation modal display exact area name (`selectedAreaObj.name`), delivery charges (`Rs. 380.00`), and accurate total payable amount without showing 0.
- [x] **WhatsApp Notification & Backend Order Submission (`checkout/page.tsx`)**: Forwarded `deliveryCharge`, destination address, and phone number to `/api/orders` and WhatsApp receipt builder.
- [x] **Thank You Page Dynamic Totals (`thank-you/page.tsx`)**: Updated receipt breakdown and downloadable `.txt` receipt to compute subtotal, discount, delivery charges, and total paid from database record `orderDetails.totalAmount` and `orderDetails.deliveryCharge`.
- [x] **Delivery Areas API Timing Race Fix (`checkout/page.tsx`)**: Added a dedicated `useEffect` triggered only on `[deliveryAreas]` that re-syncs `selectedDeliveryArea` after the delivery-areas API call completes — fixes the root cause where the main init effect ran with an empty `deliveryAreas = []` array (before the API resolved), leaving `selectedDeliveryArea` as `""` and rendering `deliveryCharge = 0` in both the sidebar and the confirmation modal.
- [x] **Confirmation Modal Sticky Footer Fix (`checkout/page.tsx`)**: Moved the "Place Order" / "Cancel" action footer outside the `flex-1 overflow-y-auto` scrollable content div so it is truly pinned to the bottom of the modal on all screen sizes and never scrolls away behind content.

---

## Phase 4.19 Completion Summary — Classic Layout Category Configuration via CMS

- [x] **Schema & API `classicCategories` (`PageConfig.ts`, `page-config.ts`)**: Added `classicCategories` field with persistence and automatic fallback to original 10 default categories in original hardcoded order.
- [x] **Order Page Dynamic Categories (`order/page.tsx`)**: Removed hardcoded arrays (`defaultPlatterCategoryOrder`, `defaultMenuCategoryOrder`). Category rendering and `CategoryNavStrip` are now fully driven by database-stored `classicCategories`.
- [x] **Admin Classic Categories Manager (`AdminPageBuilder.tsx`)**: Built full management suite on the CMS canvas when Classic Mode is active:
  - Add categories (pick from DB or type custom name, assign Platter vs Dish type)
  - Quick-sort categories (Move Up, Down, to Top, to Bottom)
  - Show / Hide toggle (`Eye` / `EyeOff`)
  - Remove category (`Trash2`)
  - 1-click Reset to Defaults (`RotateCcw`)
  - Category breakdown filter tabs (All, Platters, Dish Menu) with visible count badge
- [x] **Sidebar Summary (`AdminPageBuilder.tsx`)**: Live category count and scrollable category list preview in sidebar when Classic Mode is active.

---

## Phase 4.18 Completion Summary — EditMenuItemForm Modern Redesign

- [x] **Compact Modal Layout (`EditMenuItemForm.tsx`)**: Replaced overflowing popup with a responsive `max-h-[88vh]` flex column layout featuring sticky header with `UtensilsCrossed` icon and sticky action footer.
- [x] **Current Image Preview (`EditMenuItemForm.tsx`)**: Added live image thumbnail preview with "Current image" overlay badge above the upload input, with dynamic upload states ("Upload image" / "Replace image" / "Uploading...").
- [x] **Pill Toggle Controls (`EditMenuItemForm.tsx`)**: Implemented modern two-button pill toggles for **Stock Status** (*In Stock* / *Out*) and **Menu Visibility** (*Visible* / *Hidden*).
- [x] **Variations List & Empty State (`EditMenuItemForm.tsx`)**: Clean variation cards with Variation Name, Price input, and `Trash2` deletion, alongside dashed empty state and subtle informational note with zero emojis.
- [x] **Design Tokens & Dark Mode (`EditMenuItemForm.tsx`)**: Fully unified with `neutral-*` token set, uppercase divider section headers, and dark mode styling.

---

## Phase 4.17 Completion Summary — EditPlatterForm Modern Redesign

- [x] **Choice & Option Deletion (`EditPlatterForm.tsx`)**: Added `Trash2` deletion button for whole additional choice groups, `X` deletion buttons on each option pill/row, and targeted sub-handlers (`handleAdditionalChoiceHeadingChange`, `handleAdditionalOptionChange`, `addOptionToChoice`).
- [x] **Current Image Preview (`EditPlatterForm.tsx`)**: Added live image thumbnail preview with "Current image" pill badge above the upload input, and dynamic upload label state ("Upload image" / "Replace image" / "Uploading...").
- [x] **Modernized Compact Modal (`EditPlatterForm.tsx`)**: Replaced archaic popup with a responsive `max-h-[88vh]` card featuring sticky header and sticky action footer, pill toggles for stock & visibility, dashed add-button styling, neutral-* color system, and complete elimination of emojis.

---

## Phase 4.16 Completion Summary — Item Order Sorting & CMS Classic Mode Cleanup

- [x] **`sortOrder` Schema Field (`MenuItem.ts`, `Platter.ts`)**: Added `sortOrder: Number, default: 0` to both schemas for persistent manual ordering.
- [x] **Sort Order API (`updateProductSortOrder.ts`)**: `PUT` endpoint using MongoDB `bulkWrite` for atomic batch sort order persistence.
- [x] **All Item Queries Sorted (`getitems.ts`, `getitemsadmin.ts`, `platter.ts`, `platteradmin.ts`)**: All four endpoints now sort by `.sort({ sortOrder: 1, createdAt: 1 })` so customer-facing pages and admin panels respect manual ordering.
- [x] **`ItemOrderSorting.tsx` Component**: Full drag-and-drop reordering UI with category sidebar, `@dnd-kit` canvas, position rank badges (#1 gradient plum, #2 purple, #3 pink), quick arrow buttons (▲ ▼ ⤒ ⤓), unsaved-changes amber warning, and save/reset actions.
- [x] **`itemSorting` Tab in Admin Panel (`admin/page.tsx`)**: Tab registered with `ArrowUpDown` icon, data fetch on activation, and `<ItemOrderSorting />` render block.
- [x] **CMS Classic Mode Canvas Cleanup (`AdminPageBuilder.tsx`)**: `sections.map(...)` and empty-state wrapped in `{useCmsLayout && (...)}`. Classic mode shows only the banner/slider editor.
- [x] **CMS Classic Mode Sidebar Cleanup (`AdminPageBuilder.tsx`)**: Section presets wrapped in `{useCmsLayout ? ...presets... : ...info card...}`. Classic mode shows an amber warning + Classic Layout Overview checklist in place of preset buttons.

---

## Phase 4.15 Completion Summary — Configurable Checkout & Bulk Discount Management

- [x] **Hardcoded Checkout Discount Removal (`checkout/page.tsx`)**: Removed static 10% discount computation (`totalAmount * 0.10`). Checkout discounts are now dynamically resolved from the database via `/api/discount-config`.
- [x] **Backend DiscountConfig Model & API (`DiscountConfig.ts`, `discount-config.ts`)**: Built Mongoose schema and REST endpoints for storing and configuring storewide checkout discounts with support for Percentage and Fixed Amount types, minimum order subtotal thresholds, and custom labels.
- [x] **Whole-Catalog Bulk Discounting (`bulkUpdateCategoryDiscount.ts`)**: Upgraded bulk discount endpoint with `type: 'all'` and `category: 'all'` support to apply or remove discounts across all items and platters at once.
- [x] **Admin Live Discounts Monitor (`BulkDiscountManagement.tsx`)**: Added real-time live discount status banner showing active checkout discount details, total discounted products counter, active category discount badges, and a 1-click emergency reset button.
- [x] **Admin Global Checkout Discount Controller (`BulkDiscountManagement.tsx`)**: Added dedicated control card to configure checkout discounting with toggle activation, type selection, value input, min order threshold, custom label, and customer preview simulation.
- [x] **Admin Storewide Bulk Discount Tool (`BulkDiscountManagement.tsx`)**: Added 1-click tool to apply or remove discounts to all catalog items and platters simultaneously.

---

## Phase 4.14 Completion Summary — ViewCart Meta Pixel Event & WhatsApp Contact Pixel Fix

- [x] **`trackMetaViewCart` Custom Event (`metaPixel.ts`)**: Added dedicated `trackMetaViewCart` helper that fires custom Meta Pixel event `ViewCart` with `content_type: 'product'`, `content_ids`, `contents` array, `value`, `currency`, and `num_items`.
- [x] **ViewCart Trigger on Cart Open (`CartSidebar.tsx`)**: Wired `trackEvent('journey_view_cart', { item_count, total_amount, items })` inside `CartSidebar.tsx` mount `useEffect`, capturing cart views in real-time when the customer opens the cart drawer.
- [x] **Analytics Fan-Out & Clarity Mapping (`analytics.ts`)**: Integrated `trackMetaViewCart` into the unified analytics bridge fan-out for `eventType === 'journey_view_cart'`, mapped `journey_add_platter_to_cart: CLK_FUNNEL_ADD_TO_CART`, and added `journey_view_cart: 'clk_view_cart'` to the Clarity event map.
- [x] **CAPI Parity (`metaCapi.ts`)**: Added `'ViewCart'` to the server-side `SendMetaCapiEventOptions.eventName` union type.
- [x] **WhatsApp Floating Button Contact Pixel Fix (`WhatsAppButton.tsx`)**: Added `trackEvent('journey_whatsapp_click', { channel: 'whatsapp', source: 'floating_button' | 'floating_button_tooltip', destination: whatsappNumber })` to both the primary floating `<motion.a>` button and the tooltip hint link. Tapping/clicking now reliably triggers the Meta standard `Contact` event (`trackMetaContact`) and Clarity logging.
- [x] **Disabled Automatic Button Tracking (`MetaPixelProvider.tsx`)**: Injected `fbq('set', 'autoConfig', false, '${pixelId}')` before `fbq('init')` to suppress Meta Pixel's automatic heuristic button click listener which was unexpectedly dispatching `SubscribeButtonClick` / auto events on normal website buttons.

---

## Phase 4.13 Completion Summary — Horizontal Category Navigation Strip

- [x] **`CategoryNavStrip` Component (`CategoryNavStrip.tsx`)**: Created reusable horizontal category navigation strip positioned immediately below the hero banner.
- [x] **Brand-Aligned Lavender Tint**: Styled with soft light purple/lavender background tint (`bg-[#f6eff7] dark:bg-[#250a20]`), subtle rounded soft edges (`rounded-2xl`), and subtle purple border (`border-[#741052]/15 dark:border-[#d0269b]/25`).
- [x] **Full-Width Header Alignment**: Set width to `w-full` with responsive horizontal padding matching the header (`px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14`), perfectly aligning the strip with the header edges across mobile, tablet, laptop, and ultrawide screens.
- [x] **Zero Scrollbars Cross-Platform**: Suppressed horizontal scrollbars completely using `scrollbarWidth: 'none'`, `msOverflowStyle: 'none'`, and Tailwind `[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:[display:none]`.
- [x] **Evenly Spaced Labels & No Dividers**: Displayed platter categories followed by menu item categories in bold dark purple/black (`font-bold text-[#330523] dark:text-neutral-200`) with consistent padding between items (`gap-2 sm:gap-3 md:gap-4 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl`) and zero dividers.
- [x] **Fixed Circular End Chevron Buttons**: Mounted fixed white circular buttons (`bg-white dark:bg-neutral-900 border border-[#741052]/25 dark:border-[#d0269b]/40 shadow-md w-8 h-8 sm:w-9 sm:h-9 rounded-full`) with subtle purple chevrons (`<ChevronLeft />`, `<ChevronRight />`) on both left and right ends over lavender gradient fade masks.
- [x] **Full-Page Sticky Navigation (`CategoryNavStrip.tsx`, `order/page.tsx`)**: Configured `CategoryNavStrip` with `sticky top-0 z-30` and `backdrop-blur-md bg-white/80 dark:bg-black/80`. Lifted component out of the banner section DOM wrapper in `order/page.tsx` via `Fragment` so that its sticky container context spans the entire catalog, keeping it pinned to the top as customers browse down through all categories.
- [x] **Dynamic Real-Time Active Category Sync**: Integrated viewport-based `getBoundingClientRect().top` scroll-spy with smooth auto-centering of active category pills, ensuring the active category seamlessly updates as customers scroll through platter and menu sections.
- [x] **Click-To-Category Offset Scroll**: Clicking any category smoothly animates `window.scrollTo` with a calibrated `85px` top offset, ensuring section headers are never obstructed beneath the sticky strip.

---

## Phase 4.12 Completion Summary — Meta Pixel Lead→Purchase & Platter AddToCart Fix

- [x] **`trackMetaLead` Removed (`metaPixel.ts`)**: Deleted the `Lead` event function entirely — `Lead` has no valid use case in a restaurant ordering funnel.
- [x] **Feedback Fires `Purchase` Instead (`analytics.ts`)**: The `journey_feedback_submitted` / `journey_lead` analytics branch now calls `trackMetaPurchase({ orderNumber, totalAmount })` to reinforce the conversion signal (feedback is only submittable after a confirmed order). Removed `trackMetaLead` from imports.
- [x] **Platter AddToCart Always Works (`PlatterItem.tsx`)**: Removed `pendingCartItem` ref, `prevIsLocationSet` ref, and deferred-flush `useEffect`. `handleAddRequest` now always calls `performCartAdd()` immediately — matching menu item behaviour. If order type is not set, the location modal appears 300ms after the add (non-blocking). Removed unused `useRef` from React import.

---

- [x] **Carousel Navigation Indicator Proportions Refinement (`BannerSlider.tsx`)**: Perfected half-size dimensions: height halved to 2px–2.5px (`h-[2px] sm:h-[2.5px]`), circular dots scaled accordingly to 2px–2.5px round dots (`w-[2px] sm:w-[2.5px] h-[2px] sm:h-[2.5px]`), and active pill width kept wide and expanded to 28px–36px (`w-7 sm:w-8 md:w-9`) in solid white (`bg-white shadow-md`), with even spacing (`gap-1.5 sm:gap-2`), frosted capsule padding (`px-2 sm:px-2.5 py-[2px] sm:py-[3px]`), and centered positioning (`bottom-1.5 sm:bottom-2`).
- [x] **Mobile Scale Down (`BannerSlider.tsx`)**: Scaled down arrow buttons (`w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9`), chevron icons, text overlays (`text-sm` headings, `text-[10px]` subtitles), and CTA buttons to fit mobile screens perfectly without dominating viewport height.
- [x] **Dedicated Mobile Customization Controls (`AdminPageBuilder.tsx`)**: Split layout settings into separated 🖥️ Desktop vs 📱 Mobile styling panels in CMS editor. Added dedicated controls for Mobile Aspect Ratio (`16/9`, `2/1`, `4/3`, `1/1`, `21/9`), Mobile Border Radius, Mobile Horizontal Margin, Mobile Top Margin, and Mobile Navigation Arrow visibility toggle.
- [x] **Zero-Layout-Shift CSS Variable Theming (`BannerSlider.tsx`)**: Applied CSS variables for responsive margins, border radius, and aspect ratios.

---

## Phase 4.10 Completion Summary — PC Header Full-Width Responsive Layout

- [x] **Full-Width Header Expansion (`Header.tsx`)**: Removed `max-w-7xl` bottleneck on the desktop header bar, enabling the header to span full-width.
- [x] **Responsive Left & Right Spacing (`Header.tsx`)**: Configured responsive gutters (`px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14` outer and `px-4 sm:px-6 md:px-8 lg:px-10` inner), ensuring proper edge clearance on laptops, desktops, and wide monitors.

---

## Phase 4.9 Completion Summary — Cloudinary Media Gallery & Banner Media Picker Integration

- [x] **Backend Cloudinary Media API (`/api/media`)**: Built REST handler supporting listing with Search API + Admin fallback, pagination, search queries, multi-file upload, and single/bulk deletion.
- [x] **Full-Featured Media Gallery (`MediaGallery.tsx`)**: Built rich responsive gallery with search, format filters, format badges, and live upload progress indicator.
- [x] **Bulk Operations**: Added multi-select mode with selection count bar, Select All Filtered / Deselect All, and bulk delete modal with confirmation.
- [x] **Side-by-Side Detail Inspection Modal**: On image click, displays high-res image on the left and full technical specifications on the right (pixel dimensions, file size in B/KB/MB, image type badge, upload date/time, public ID, direct Cloudinary link with 1-click copy button, and single delete button with confirmation).
- [x] **Admin Panel Tab (`admin/page.tsx`)**: Registered `Media Gallery` tab with `ImageIcon` in sidebar navigation and rendered full `<MediaGallery />` view.
- [x] **Banner & Slider Media Gallery Integration (`AdminPageBuilder.tsx`)**: Added "Gallery" picker buttons across Hero Banner (Desktop & Mobile), Image Banner Slider (per-slide Desktop & Mobile), Story Content, and Classic Layout Hero banner, allowing administrators to choose existing images or upload new ones.

---

## Phase 4.8 Completion Summary — Classic Layout Banner Slider Selection & Admin Theme Refactor

- [x] **Theme Hook Resolution (`admin/page.tsx`)**: Re-imported `useTheme` from `next-themes` and instantiated `const { setTheme } = useTheme()` inside `AdminDashboard`, resolving the runtime `ReferenceError: setTheme is not defined` on the Preferences tab.
- [x] **Classic Layout Banner Mode Selection (`AdminPageBuilder.tsx`)**: Integrated segmented control to choose between **Hero Banner** (single image/text header) and **Image Banner Slider** (multi-slide carousel) in Classic Normal Layout mode.
- [x] **Modular `ImageSliderConfigEditor` Subcomponent (`AdminPageBuilder.tsx`)**: Extracted a standalone editor handling per-slide desktop and mobile browser/phone mockup previews, direct upload & URL input, pure image vs text overlay toggle, slide headings, subtitles, CTA button links, overlay opacity, text color & alignment, autoplay with interval timing, navigation arrows, dot navigation pills, horizontal/top margins, and border-radius.
- [x] **Backend & Schema Persistence (`PageConfig.ts`, `api/page-config.ts`)**: Added `classicBannerType: { type: String, enum: ['hero', 'image-slider'], default: 'hero' }` to MongoDB model and updated REST endpoint to persist user preference.
- [x] **Dynamic Customer Storefront Rendering (`order/page.tsx`)**: Wired `classicBannerType` state and conditional renderer to display either `<BannerSlider />` or `<Hero />` in Classic Layout mode based on admin choice.

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
- [x] **Compact Bottom-Right Browse-Mode Banner (`RestaurantStatusPopup.tsx`)**: Replaced the wide, intrusive top-center "View Only Menu Mode" banner with a compact `280px` floating toast anchored to the bottom-right. Shows pulsing dot, "Browse Only · Opens 6:30 PM", live `HH:MM:SS` countdown, and a small "Timer" button to reopen the full closed modal — all without blocking the menu catalog.
- [x] **HD Logo Rollout & Oversized Circular Emblem (`Header.tsx`, `Footer.tsx`, `MaintenanceScreen.tsx`)**: Upgraded to `/hd-logo.webp` across all headers and footers; encased desktop logo in an oversized circular emblem (`w-32 h-32 bg-[#5c0d40]`) that extends elegantly across the header bar.
- [x] **Noscript Phantom Box Removal (`MetaPixelProvider.tsx`)**: Stripped redundant `<noscript>` tag from the client-side provider to prevent App Router hydration from displaying an invisible/broken artifact box on top of the layout.
- [x] **Image Banner Slider & Admin Page Builder Revamp (`BannerSlider.tsx`, `AdminPageBuilder.tsx`, `order/page.tsx`, `PageConfig.ts`)**: Built dynamic promotional banner carousel with customizable margins, 20px rounded borders, inner navigation arrows, bottom dotted pill indicator, touch swipe, auto-play, and per-slide "Image Only" toggle. Fixed preset filtering in `AdminPageBuilder.tsx` so "Image Banner Slider" appears cleanly under "Header & Banners" in the Order Page CMS tab, and wired `BannerSlider` to render in both Classic Normal Layout mode and Advanced CMS mode.
- [x] **Meta Pixel Standard Events Implementation (`metaPixel.ts`, `analytics.ts`, `metaCapi.ts`, `Header.tsx`, `Footer.tsx`, `checkout/page.tsx`, `thank-you/page.tsx`)**: Built type-safe client helpers and wired the 10 relevant restaurant standard events across the ecosystem:
  - **E-Commerce Funnel**: `ViewContent` (Item/Platter details), `CustomizeProduct` (Variation & option picks), `AddToCart` (Item & Platter additions), `InitiateCheckout` (Cart/Checkout open), `AddPaymentInfo` (Payment method toggle), `Purchase` (Thank-you & CAPI deduplication).
  - **Intent & Contact**: `Contact` (Header phone, mobile WhatsApp, drawer links, footer), `FindLocation` (Table/Area selection in TableForm & Map directions), `Search` (Menu queries), `Lead` (Feedback submission).
  - **CAPI Parity**: Updated server-side `SendMetaCapiEventOptions` with full union types. All events default to `PKR` currency and support deduplication event IDs.

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
