---
title: "Project Status Dashboard — Advanced Ordering Ecosystem"
tags:
  - #type/status
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-23
overall_completion: "Phase 4.43: Direct Link Frictionless Add-to-Cart & Deferred Checkout Location (100%)"
current_sprint: "CLK Ad Campaign Conversion Funnel UX: Suppress location popup on browsing, defer to checkout"
---

# Project Status Dashboard — Advanced Ordering Ecosystem

## Sub-Project Status Matrix

| Sub-Project | Phase | Focus | Status |
| :--- | :--- | :--- | :--- |
| **Cafe Little Karachi (CLK)** | Phase 4.43 | Direct Link Frictionless Add-to-Cart & Deferred Checkout Location | **Completed** 🟢 |
| **The Chai Company (TCC)** | Phase 4.32 | Centered Modern Tea Lounge Footer | **Completed** 🟢 |

---

## Phase 4.43 Completion Summary — Direct Link Frictionless Add-to-Cart & Deferred Checkout Location Selection

- [x] **`OrderContext.tsx`**: Added `isDirectLinkCustomer` detection via pathname (`/item/*`, `/platter/*`) and `sessionStorage`. Suppresses auto-open of `isLocationModalOpen` for direct-link visits. Exposes `isDirectLinkCustomer` in context.
- [x] **`layout.tsx`**: Mounted `<TableForm />` globally inside `<OrderProvider>/<CartProvider>` so the single modal is accessible on all routes without per-route duplicates.
- [x] **`MenuItem.tsx`**: Removed `isLocationSet` and `setLocationModalOpen` from `useOrder()` destructure. Add-to-cart is now instant with no location check popup.
- [x] **`PlatterItem.tsx`**: Same cleanup — platter add-to-cart is now instant via `performCartAdd()` without location check popup.
- [x] **`checkout/page.tsx`**: Added deferred location modal trigger (`useEffect` → `setLocationModalOpen(true)` at 300 ms if `!isLocationSet`). Added Order Mode Switcher card at top of form (confirmed mode shows mode icon + "Change" button; unset mode shows amber pulsing CTA). Added `!isLocationSet` guard in `handleCheckout` that reopens modal and blocks order submission.
- [x] **`platter/[slug]/page.tsx`**: Removed duplicate `<TableForm />` render (now globally in `layout.tsx`).

---

- [x] **Attribution Engine (`src/app/lib/orderSource.ts`)**: Built UTM parameter parsing and attribution engine capturing `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, landing page, and external referrer with sessionStorage persistence and Microsoft Clarity session metadata tagging (`order_source`, `campaign`, `utm_medium`).
- [x] **Universal Visitor Capture (`OrderSourceCapture.tsx`, `layout.tsx`)**: Mounted invisible capture client component in RootLayout ensuring attribution is captured immediately upon customer landing on any page.
- [x] **Database Schema & Persistence (`Order.ts`, `orders.ts`)**: Added `orderSource` subdocument to Mongoose schema with fallback defaults; updated order creation POST API to persist attribution payload.
- [x] **Checkout Integration (`checkout/page.tsx`)**: Injected `orderSource: getOrderSource()` into order submission payload.
- [x] **Attribution Analytics API (`/api/order-source-analytics`)**: Built aggregation endpoint supporting time ranges (`today`, `7d`, `30d`, `90d`, `all`), calculating total orders, revenue, paid ads vs organic metrics, top converting channels, campaign breakdowns, and daily timeline trends.
- [x] **Order Sources Admin Dashboard Tab (`OrderSourceAnalytics.tsx`, `admin/page.tsx`)**: Created dedicated "Order Sources" tab with 4 summary KPI cards, channel share breakdown with color-coded badges, active ad campaigns table, daily orders bar chart, campaign UTM link generator tool, and recent orders attribution feed.
- [x] **Live Orders Source Badges (`OrdersList.tsx`)**: Rendered source badges (e.g. `Facebook Ads`, `Instagram Ads`, `Google Ads`) directly on live order cards across Grid and Kanban views.

---

## Phase 4.41 Completion Summary — Live Orders Cancel Order Section

- [x] **Cancelled Status Engine (`OrdersList.tsx`)**: Added `isOrderCancelled` helper detecting cancelled/voided statuses and `isOrderActive` ensuring clean separation between active Received orders, Delivered orders, and Cancelled orders.
- [x] **HUD 4-Button Action Dashboard (`OrdersList.tsx`)**: Upgraded top metric filter bar to 4-column responsive grid (`Received`, `Delivered`, `Cancelled`, `All Orders`) featuring dedicated Rose/Crimson `CANCELLED (Voided)` trigger with real-time cancelled order count badge.
- [x] **Grid View Order Cards (`OrdersList.tsx`)**: Added crimson top banner (`bg-gradient-to-r from-rose-700 to-red-900`) with `Ban` icon for cancelled cards, strikethrough price formatting, 1-click `[ Cancel Order ]` action on active cards, and `[ Restore ]` button to seamlessly uncancel / return voided orders to the active Received queue.
- [x] **Kanban 3-Column Board (`OrdersList.tsx`)**: Expanded Kanban board into 3 distinct stages: `RECEIVED (Pending)`, `DELIVERED (Fulfilled)`, and `CANCELLED (Voided)` with dedicated count badges and 1-tap Restore controls.
- [x] **Table View List (`OrdersList.tsx`)**: Added red `CANCELLED` status badge and contextual actions (`Deliver` & `Cancel` on active, `Undo` on delivered, `Restore` on cancelled).
- [x] **POS Ticket Inspector Modal (`OrdersList.tsx`)**: Digital ticket inspector header and status control block now clearly support `CANCELLED (VOIDED)` with 1-click status mutation and restore capability.
- [x] **Receipt Downloader Status Parity (`OrdersList.tsx`)**: Slip download reflects accurate `Order Status: CANCELLED` when voided.

---

## Phase 4.40 Completion Summary — Live Orders Exact AM/PM Placement Time

- [x] **Exact 12-Hour AM/PM Time Helper (`OrdersList.tsx`)**: Added `formatExactTime` helper to format order creation timestamps into readable 12-hour AM/PM format (e.g., `8:45 PM`, `12:30 AM`).
- [x] **Grid View Time Sub-Label (`OrdersList.tsx`)**: Displayed exact placement time directly beneath relative duration (`1h ago`, `15m ago`) in the order card top status banner.
- [x] **Kanban View Time Alignment (`OrdersList.tsx`)**: Displayed exact placement time beneath relative duration in both Received and Delivered column card headers.
- [x] **Table View List Sub-Label (`OrdersList.tsx`)**: Displayed exact placement time in the Time column beneath relative time.
- [x] **Ticket Inspector Modal Header (`OrdersList.tsx`)**: Included relative time and exact placement time in the POS ticket inspector header.

---

## Phase 4.39 Completion Summary — Native Next.js 15 robots.txt and Dynamic Sitemap

- [x] **Native `robots.ts` (`src/app/robots.ts`)**: Built App Router `robots.ts` defining crawl rules for search bots (allowing `/`, disallowing `/admin`, `/api/`, `/checkout`, `/thank-you`), and linking sitemap URL (`/sitemap.xml`).
- [x] **Dynamic `sitemap.ts` (`src/app/sitemap.ts`)**: Built App Router `sitemap.ts` querying live MongoDB catalog items (`MenuItem`) and platters (`Platter`), dynamically generating clean canonical routes (`/item/[slug]` & `/platter/[slug]`) alongside core static pages (`/`, `/order`) with priorities and update timestamps.
- [x] **SEO `metadataBase` (`src/app/layout.tsx`)**: Configured `metadataBase` in root layout metadata for canonical URL and OpenGraph resolution.

---

## Phase 4.38 Completion Summary — PostHog Configuration Complete Removal

- [x] **Provider & Root Layout (`PostHogProvider.tsx`, `layout.tsx`)**: Deleted `PostHogProvider.tsx` and removed `<CSPostHogProvider>` wrapper from root layout.
- [x] **Component Tracking Cleanup (`thank-you/page.tsx`, `checkout/page.tsx`, `CartSidebar.tsx`, `MenuItem.tsx`, `PlatterItem.tsx`)**: Removed all `posthog` imports, `posthog.capture(...)`, `posthog.identify(...)`, and `posthog.reset()` invocations.
- [x] **Dependency Uninstallation (`package.json`)**: Uninstalled `posthog-js` package.
- [x] **Documentation & README (`README.md`, `memory.md`, `status.md`)**: Updated documentation to reflect the clean removal.

---

## Phase 4.36 Completion Summary — Website Title & Favicon Update

- [x] **Website Title Update (`layout.tsx`)**: Changed page title to **`Little Karachi Express`** in `export const metadata: Metadata`.
- [x] **Favicon Update (`layout.tsx`, `favicon.ico`)**: Configured `icons` object with `/hd-logo.ico` (`icon`, `shortcut`, `apple`) and synchronized `public/hd-logo.ico` into `src/app/favicon.ico`.

---

## Phase 4.35 Completion Summary — Cafe Little Karachi Launch Brag Video

- [x] **Brag Skill & Toolchain Deployment**: Installed and verified `.agents/skills/brag`, Hyperframes CLI `v0.8.47`, and FFmpeg `9.0.1-full_build`.
- [x] **Brag Plan & Creative Brief (`brag-plan.md`, `composition-brief.md`)**: Designed a 19.5-second, 4-scene narrative showing authentic Karachi dining heritage, interactive Biryani customization, table QR ordering, and real-time Socket.IO tracking.
- [x] **Hyperframes Composition (`composition/index.html`)**: Authored GSAP animations with exact audio cue locks (1.60s, 3.70s, 5.80s, 9.50s, 14.50s), tactile UI toggles, and live price counters.
- [x] **Zero-Error Quality Gate (`npx hyperframes check`)**: Passed 86/86 WCAG AA contrast tests with zero runtime, layout, or motion issues.
- [x] **Video Render & Universal Poster Frame Bake (`brag.mp4`, `brag.jpg`)**: Rendered 1080p video at 30fps with synchronized audio bed and SFX, extracted settled poster frame `brag.jpg`, and baked frame 0 as the universal thumbnail.
- [x] **Social Share Copy (`share-copy.txt`)**: Prepared launch copy ready for posting on X/LinkedIn/Discord.

---

## Phase 4.34 Completion Summary — Localhost Dev Bypass for Hours Lock

- [x] **Direct Product Link Off-Hours Unblocked View (`RestaurantStatusPopup.tsx`)**: When customers navigate directly to product or platter campaign URLs (e.g. `/item/beef-white-biryani-1-kg-deg`, `/platter/[slug]`), the fullscreen "currently closed" lock popup is suppressed on mount, allowing customers to view the full product card, prices, images, and portion variations without any blocking overlay before 06:30 PM.
- [x] **Modal Cut / Dismiss Before 06:30 PM (`MenuItem.tsx`, `PlatterItem.tsx`)**: When a customer dismisses or closes the product/platter modal (`closeModal`) before 06:30 PM (`!isOpenAt()`), the before 06:30 lock popup (`RestaurantStatusPopup`) immediately takes over the screen with the live countdown and schedule.
- [x] **Add to Cart Before 06:30 PM (`MenuItem.tsx`, `PlatterItem.tsx`, `AddToCartButton.tsx`)**: Clicking "Add to Cart" inside a product or platter modal before 06:30 PM (`!isOpenAt()`) immediately triggers and displays the before 06:30 lock popup.
- [x] **Location Checks at or After 06:30 PM (`MenuItem.tsx`, `PlatterItem.tsx`)**:
  - When the restaurant is open (`isOpenAt()`), closing the modal without selecting an order mode triggers the location selector modal (`TableForm`) if `!isLocationSet`.
  - Clicking "Add to Cart" adds the item to the cart and triggers the location modal if `!isLocationSet`.
- [x] **Global OrderContext Status State (`OrderContext.tsx`)**: Added `isStatusModalOpen` and `setStatusModalOpen(boolean)` to `OrderContext` for synchronized state control between product modals, platter modals, and the restaurant operating status popup.
- [x] **Catalog Direct Slug Propagation (`order/page.tsx`)**: Forwarded `initialItemSlug` and `initialPlatterSlug` through `ItemGridSection`, `ItemSliderSection`, and Classic Layout category render loops with `initialOpen={...}` for instantaneous modal auto-opening.

---

## Phase 4.32 Completion Summary — Centered Minimalist Modern Footer Revamp

- [x] **Quick Links Elimination (`Footer.tsx`)**: Removed multi-column grid structure and legacy quick navigation links (`/about`, `/menu`, `/contact`, `/terms`), decluttering the footer entirely.
- [x] **Centered Modern Visual Layout (`Footer.tsx`)**: Refactored the layout into a clean, center-aligned flex container with luxury dark plum background (`bg-gradient-to-b from-[#25041a] via-[#350726] to-[#1a0212]`), subtle top/bottom ambient lighting orbs, and a delicate top border.
- [x] **Brand Emblem & Halo Glow (`Footer.tsx`)**: Encased high-definition logo (`/hd-logo.webp`) in an interactive circular backdrop-blurred emblem with warm glowing ambient aura.
- [x] **Brand Story & Tagline (`Footer.tsx`)**: Displayed a warm, authentic brand description tailored for dining and fast delivery.
- [x] **Interactive Contact Pills (`Footer.tsx`)**: Centered glassmorphic contact pills for Direct Call (`+92 333 1702706`), WhatsApp Support, and Google Maps Location Directions with event tracking and hover glow.
- [x] **Brand Social Buttons (`Footer.tsx`)**: Clean circular buttons for Facebook and Instagram with custom brand hover tints, scale micro-animations, and Meta Pixel / Clarity journey tracking.
- [x] **Centered Divider & Dynamic Copyright (`Footer.tsx`)**: Subtle gradient divider, dynamic copyright year (`© {new Date().getFullYear()}`), and pulsing live status badge (`Open Daily · Dine-In, Takeaway & Express Delivery`).
- [x] **Mobile Responsiveness & Back to Top (`Footer.tsx`)**: Fully responsive flex-wrap layout preventing overflow on small screens, paired with a centered smooth "Back to Top" capsule button.

---

## Phase 4.31 Completion Summary — Banner Slider Zero-Cutoff, Smart Contain Fit & Single-Banner Sizing

- [x] **Smart Zero-Cutoff Image Contain (`BannerSlider.tsx`)**: Upgraded slide image rendering to use `object-contain` as default fit mode, guaranteeing that 100% of the banner graphic (left, right, top, bottom) is rendered without any edges getting cut off or cropped.
- [x] **Ambient Blurred Backdrop Glow (`BannerSlider.tsx`)**: Injected a matching ambient blurred backdrop (`blur-2xl scale-110 opacity-30 dark:opacity-40`) of the banner image behind the contained graphic, seamlessly filling any letterboxing areas with luxury brand ambiance.
- [x] **Single-Banner Mobile Sizing Adaptability (`BannerSlider.tsx`)**: When only a PC banner is uploaded (`!s.mobileImage`), the mobile aspect ratio automatically adapts to the panoramic/wide ratio (`aspectRatio || '21/9'`) with contain fit, preventing mobile devices from applying a 16:9 crop that cuts the sides.
- [x] **Desktop & Mobile Fit Controls (`AdminPageBuilder.tsx`)**: Added `Desktop Image Fit` and `Mobile Image Fit` dropdowns (`contain`, `cover`, `fill`) alongside expanded aspect ratio presets in the CMS editor (`auto`, `21/8`, `21/9`, `16/9`, `2/1`, `3/1`, `4/1`, `4/3`, `1/1`).
- [x] **Admin Mockup Visual Parity (`AdminPageBuilder.tsx`)**: Updated PC browser and mobile phone mockup previews in the CMS slide editor to display images with contain mode and ambient glow, giving administrators an accurate WYSIWYG preview.
- [x] **Schema TypeScript Interface Parity (`PageConfig.ts`)**: Added `'image-slider'` to the `IPageSection.type` union and extended `BannerSlide` & `PageSection.props` interfaces with `imageFit` and `mobileImageFit`.

---

## Phase 4.30 Completion Summary — Cart Backdrop Blur & Popular Upsell Carousel

- [x] **Full-Screen Backdrop Blur Overlay (`CartSidebar.tsx`)**: Upgraded cart overlay from inner panel constraint to full-screen `fixed inset-0 z-50` backdrop with `backdrop-filter: blur(8px)`, `-webkit-backdrop-filter: blur(8px)`, `bg-black/40` tint, smooth 220ms fade in/out animation, and click-to-close behavior. The cart drawer panel sits at `z-50` in front, perfectly sharp and unblurred.
- [x] **"Popular with your order" Upsell Carousel (`CartSidebar.tsx`)**: Inserted horizontal recommendation carousel between `"Add more items"` and the Order Summary box. Features brand plum accent pill, `Flame` icon, left/right programmatic scroll buttons, smooth swipe, square aspect ratio thumbnails with overlaid circular `+` 1-tap add buttons, bold prices, and muted item titles.
- [x] **Instant 1-Tap Cart Addition (`CartSidebar.tsx`)**: Clicking `+` immediately adds 1 quantity to the cart via `addToCart()`, recalculating subtotal, delivery fee, and grand total in real-time without navigating away or closing the drawer.
- [x] **Backend & Schema Architecture (`CartUpsellConfig.ts`, `cart-upsells.ts`)**: Built Mongoose model and REST API for storing upsell configuration (`isEnabled`, `heading`, `mode: 'auto' | 'manual'`, `itemIds`). Auto mode dynamically serves top in-stock dishes; manual mode serves curated dish lists.
- [x] **Admin Recommendations Manager (`CartUpsellManagement.tsx`, `admin/page.tsx`)**: Created dedicated `Cart Upsells` tab in admin dashboard with `Flame` icon, live drawer simulation preview, enable toggle, heading input, selection strategy switch, catalog product picker with search & category filters, and sequence reordering.

---

## Phase 4.29 Completion Summary — Forms Gallery Picker & Upload Dual-Choice

- [x] **Add Menu Item Form (`MenuItemForm.tsx`)**: Dual image action buttons `[ Choose Gallery ]` and `[ Upload New ]`, preview thumbnail card with change/remove controls, and `MediaGallery` modal picker (`isPicker={true}`).
- [x] **Edit Menu Item Form (`EditMenuItemForm.tsx`)**: Image section with Gallery selection and direct file upload, compact current image card, and embedded `MediaGallery` modal picker.
- [x] **Add Platter Form (`AddPlatterForm.tsx`)**: Dual action controls for picking from existing Media Gallery or uploading new image to `cafe-little-karachi/platters`, with image preview card and picker modal.
- [x] **Edit Platter Form (`EditPlatterForm.tsx`)**: Seamless choice to select from gallery or upload new, with thumbnail preview, change triggers, and modal picker.

---

- [x] **"Used In" API (`media-usage.ts`)**: `GET /api/media-usage?url=` endpoint scans MenuItem, Platter, and PageConfig in MongoDB, returning all usages (menu items, platters, banners, sliders, story sections) for a given Cloudinary image URL with full TypeScript schema alignment.
- [x] **"Used In" Popup Panel (`MediaGallery.tsx`)**: Image detail popup right column now contains a color-coded "Used In" section with contextual icons, loading state, and "not used" empty state for easy orphan identification.
- [x] **Storage Stats Bar (`MediaGallery.tsx`)**: Stats bar shows total media count and combined storage size above the image grid. Filtered count shown when active. Amber note shown when more pages exist.
- [x] **Popup Overlay Full-Screen Fix (`MediaGallery.tsx`)**: Raised modal overlay from `z-[110]` to `z-[300]` to fully cover the sticky AdminHeader's `backdrop-blur-xl` stacking context.

---

## Phase 4.26 Completion Summary — Live Orders Tab Luxury Revamp & 2-Status Simplification

- [x] **2-Status Manager Workflow (`OrdersList.tsx`)**: Eliminated intermediate statuses (Preparing, Ready, Out for delivery) and condensed the entire order lifecycle into 2 simple, foolproof states:
  - 🟡 **`RECEIVED`** (Pending / In Progress) with a giant 1-click **`[ ✓ MARK AS DELIVERED ]`** action button.
  - 🟢 **`DELIVERED`** (Fulfilled) with an **`[ Undo ]`** button to revert if needed.
- [x] **Big Visual Metric Cards (`OrdersList.tsx`)**: 3 large top status trigger buttons: `RECEIVED (Pending)`, `DELIVERED (Completed)`, and `ALL (Total)`.
- [x] **Scannable Order Cards (`OrdersList.tsx`)**: High-contrast cards with large copyable `#CLK-XXXX` ID, order mode chips (Dine-in with table #, Delivery with area, Pickup), prominent green WhatsApp & blue Call buttons, and large quantity dish list.
- [x] **Backend Completed Query Support (`fetchCompletedOrders.ts`)**: Updated query regex `/^(completed|delivered)$/i` to treat both Delivered and Completed orders equivalently.
- [x] **Admin Container Cleanup (`admin/page.tsx`)**: Rendered `OrdersList` full-bleed without double-nested card wrappers.

---

## Phase 4.25 Completion Summary — Admin Panel Tab Label Renaming

- [x] **Tab Label Renaming (`admin/page.tsx`)**:
  - Renamed `Menu Catalog` tab to **`Menu Items`**.
  - Renamed `Gourmet Platters` tab to **`Platter Items`**.
- [x] **Header & Sidebar Synchronization (`admin/page.tsx`)**: The top `AdminHeader` breadcrumb title and sidebar navigation button labels automatically reflect the updated naming.

---

## Phase 4.24 Completion Summary — Order Page Category Sorting & Unified Sequence Rendering

- [x] **Eliminated Hardcoded Platter-First Partitioning (`order/page.tsx`)**: Replaced the separate `activePlatterCategoryOrder` (platters first) and `activeMenuCategoryOrder` (dishes second) blocks with a single unified map over `visibleClassicCategories`.
- [x] **Strict CMS Sorting Adherence (`order/page.tsx`)**: The order page now renders categories in the exact sequence configured in the CMS tab (#1, #2, #3, etc.), allowing dish categories (e.g. `Pulao.com`, `Very Fast Food`) to appear above platters when ordered by the administrator.
- [x] **Defaults Parity (`page-config.ts`, `AdminPageBuilder.tsx`)**: Added `Pulao.com` (`pulao-com`) to `DEFAULT_CLASSIC_CATEGORIES` across backend and CMS builder defaults.

---

## Phase 4.23 Completion Summary — White Biryani Menu Products Upload to Pulao.com Category

- [x] **Product Catalog Seeding (`scripts/upload-pulao-products.ts`)**: Uploaded and verified 6 White Biryani dishes in MongoDB `menuitems` collection under category `Pulao.com`.
- [x] **Items Uploaded**:
  - `Chicken White Biryani – 1 KG Deg` (Rs. 2,050) — `1 KG Chicken, 1 KG Rice`
  - `Beef White Biryani – 1 KG Deg` (Rs. 2,950) — `1 KG Beef, 1 KG Rice`
  - `Chicken White Biryani – 375 Gram` (Rs. 225) — `375 Gram – Rice, 1 Chicken Piece, Aloo`
  - `Beef White Biryani – 375 Gram` (Rs. 275) — `375 Gram – Rice, 3 Beef Pieces, Aloo`
  - `Chicken White Biryani – 500 Gram` (Rs. 300) — `500 Gram – Rice, 1 Chicken Piece, Aloo`
  - `Beef White Biryani – 500 Gram` (Rs. 370) — `500 Gram – Rice, 4 Beef Pieces, Aloo`
- [x] **Category Management & Visibility Sync**: Ensured `Pulao.com` exists in MongoDB `categories` collection and updated `PageConfig.classicCategories` to include `{ id: 'pulao-com', name: 'Pulao.com', isPlatter: false, isVisible: true }`.
- [x] **Placeholder Cloudinary Assets**: Attached high-resolution Cloudinary placeholder images from the CLK gallery for immediate customer storefront rendering.

---

## Phase 4.22 Completion Summary — Variable Delivery Charge Display for On-Demand Areas

- [x] **Modal & Landing Area Selector (`TableForm.tsx`)**: Replaced `(Rs. 0)` with `(Variable)` in dropdown options when delivery charge is 0 or on-demand.
- [x] **Checkout Zone Badge (`checkout/page.tsx`)**: Badge dynamically displays `Delivery: Variable` instead of `Delivery: Rs. 0` when `deliveryCharge === 0`.
- [x] **Checkout Dropdown Selector (`checkout/page.tsx`)**: Formats delivery areas with `(Variable)` instead of `(Rs. 0)` while keeping attached notes intact.
- [x] **Desktop Order Summary Card (`checkout/page.tsx`)**: Renders `Variable` for delivery fee row when `deliveryCharge === 0`.
- [x] **Mobile Sticky Bottom Summary (`checkout/page.tsx`)**: Renders `Variable` for delivery fee row when `deliveryCharge === 0`.
- [x] **Standard Price Preservation**: Standard delivery zones with non-zero charges (e.g., `Rs. 200`, `Rs. 250`) and timing notes continue displaying their fixed prices accurately.

---

## Phase 4.21 Completion Summary — Social Media Links & Footprint Cleanup

- [x] **Live Social Channels Configured (`Footer.tsx`)**: Linked Little Karachi Express official Facebook (`https://www.facebook.com/littlekarachiexpress`) and Instagram (`https://www.instagram.com/littlekarachiexpress`).
- [x] **Placeholder Dummy # Cleanup (`Footer.tsx`)**: Removed Twitter and LinkedIn entries with dummy `#` links.
- [x] **Unused Icons Removed (`Footer.tsx`)**: Cleaned imports by removing `FaTwitter` and `FaLinkedin` from `react-icons/fa`.
- [x] **Security & Accessibility Standards (`Footer.tsx`)**: Added `target="_blank"`, `rel="noopener noreferrer"`, and explicit `aria-label` attributes.
- [x] **Contact Analytics Integration (`Footer.tsx`)**: Attached `trackEvent('journey_contact', ...)` to social icons to log standard `Contact` Meta Pixel events and Clarity session metrics.

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
