---
title: "Living Project Memory & Task Tracker — Advanced Ordering Ecosystem"
tags:
  - #type/memory
  - #status/active
  - #project/ordering-ecosystem
created: 2026-09-04
last_updated: 2026-09-11
---

# Living Project Memory & Task Tracker

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
