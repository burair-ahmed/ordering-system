---
title: "Product Requirements Document (PRD) — Advanced Ordering Ecosystem"
tags:
  - #type/prd
  - #scope/full-platform
  - #project/ordering-ecosystem
created: 2026-08-28
version: 1.0.0
status: Active Blueprint
---

# Product Requirements Document (PRD) — Advanced Ordering Ecosystem

- **Location**: `documentation/PRD.md`
- **Vault Links**: [[README|Home MOC]] | [[architecture|Technical Architecture]] | [[design|Design System]] | [[phases|Roadmap]] | [[status|Status]]

---

## 1. Product Vision & Executive Summary

The **Advanced Ordering Ecosystem** is a monorepo housing two specialized, production-grade restaurant management and ordering platforms. Each platform is independently deployed but shares a common architectural DNA: real-time order tracking, a granular item customization engine, and a powerful admin dashboard.

### Sub-Projects

| Platform | Description | Specialty |
|---|---|---|
| **Cafe Little Karachi (CLK)** | Premium restaurant platform for dine-in and takeaway | Complex item variation engine, dine-in table management, Pakistani cultural aesthetic |
| **The Chai Company (TCC)** | High-speed quick-service cafe ordering platform | Optimized cart UX, streamlined platter management, fast checkout flows |

---

## 2. Core User Personas & Permissions Matrix

| Persona | Description | Key Objectives | Access & Permissions |
|---|---|---|---|
| **Super Admin** | Platform/restaurant owner | Full menu management, order history, analytics dashboard, staff management | Full read/write on all modules |
| **Kitchen Staff** | Back-of-house team | View incoming orders, update order status (Preparing, Ready) | Read orders, write status updates only |
| **Customer (Dine-In)** | Table-based customer | Browse menu, select table, customize items, place order, track real-time status | Full ordering flow, read-only order tracking |
| **Customer (Takeaway)** | Pickup customer | Browse menu, customize items, place order, receive WhatsApp confirmation | Full ordering flow, no table selection |

---

## 3. Detailed Functional Requirements

### 3.1 Module 1: Menu System & Item Catalog
- **Category Management**: Organize menu items into categories (Starters, Mains, Beverages, Desserts, Platters).
- **Item CRUD**: Create, read, update, and soft-delete menu items. Each item includes: name, description, base price, category, image (Cloudinary URL), availability toggle, and variations.
- **Availability Toggle**: Admins can mark items as available/unavailable in real time without deletion.
- **Image Management**: Upload images via Cloudinary API. Display with Next.js `<Image>` component for performance.

### 3.2 Module 2: Variation Engine (CLK Flagship Feature)
- **Variation Groups**: Each menu item can have multiple `VariationGroup` objects (e.g., "Size", "Spice Level", "Add-ons").
- **Group Configuration**:
  - `title` (string): Group label shown to customer.
  - `isRequired` (boolean): Customer must select one option before adding to cart.
  - `options[]`: Array of `{ name: string, additionalPrice: number }`.
- **Pricing Logic**: Final item price = `basePrice + sum(selectedOption.additionalPrice)`.
- **Cart Validation**: Required groups with no selection block "Add to Cart" action.
- **Admin UI**: `VariationGroupEditor` component for building and reordering groups inline.

### 3.3 Module 3: Cart & Order Placement
- **Cart State**: Managed via `CartContext`. Persists across route navigation. Supports quantity increments/decrements.
- **Cart Item Shape**:
  ```typescript
  interface CartItem {
    menuItemId: string;
    name: string;
    basePrice: number;
    selectedVariations: Record<string, string>; // groupTitle → optionName
    additionalPrice: number;
    quantity: number;
    totalPrice: number; // (basePrice + additionalPrice) * quantity
  }
  ```
- **Order Submission**: `POST /api/orders` with full cart payload, table number (if dine-in), and customer contact details.

### 3.4 Module 4: Real-Time Order Tracking
- **Status Lifecycle**: `pending` → `accepted` → `preparing` → `ready` → `completed` (or `cancelled`).
- **Customer View**: Live progress bar/tracker UI that updates without page refresh via Socket.IO.
- **Admin View**: Live incoming orders dashboard with auto-sorted queue by time received.
- **Socket Events**:
  - `new_order` — emitted by server after order is saved; received by admin dashboard.
  - `order_updated` — emitted by server after status change; received by customer tracker.

### 3.5 Module 5: WhatsApp Notification System (Twilio)
- **Trigger**: After order is confirmed (status changes to `accepted`).
- **Content**: Order ID, item list, estimated wait time, and restaurant contact.
- **Implementation**: Twilio WhatsApp API via `src/pages/api/` route. Must NEVER block the order flow — fire and forget with error logging.

### 3.6 Module 6: Admin Dashboard
- **Order Queue**: Live-updating list of all active orders sortable by time, status, and table.
- **Order Management**: Admins can accept, update status, and mark orders as complete or cancelled.
- **Menu Management**: Full CRUD for menu items, variation groups, categories, and pricing.
- **Bulk Operations**: Bulk price update, bulk availability toggle for categories.
- **Analytics Panel**:
  - Orders placed per day/week/month.
  - Top-selling items by revenue.
  - Average order value.
  - Cart abandonment rate (PostHog integration).

### 3.7 Module 7: Table & Dine-In Management (CLK)
- **Table Map**: Visual seating layout. Admins assign table numbers and capacity.
- **Table Selection**: Customers select their table at the start of the ordering flow.
- **Table Status**: `available`, `occupied`, `reserved`. Updated in real time via Socket.IO.
- **`TableContext`**: Global context tracking active table assignment for the current session.

### 3.8 Module 8: Platter Management (TCC)
- **Platter Definition**: Admin configures a platter as a bundle with a base set of included items and customizable slots.
- **Customer Customization**: Customer fills each slot from a predefined list of allowed items.
- **Pricing**: Fixed platter base price + optional slot upgrade charges.

---

## 4. Non-Functional Requirements (NFRs)

- **Performance**:
  - Admin dashboard must render and update in < 500ms on Socket.IO events.
  - Menu page initial load < 2 seconds on 4G networks using Next.js SSR/ISR.
- **Reliability**:
  - Order submission must succeed even if Twilio or analytics calls fail.
  - Socket.IO reconnection must be automatic with exponential backoff.
- **Security**:
  - All API route inputs validated with Zod schemas.
  - Admin routes protected by authentication middleware.
  - No sensitive credentials exposed to the client bundle.
- **Scalability**:
  - MongoDB indexes on `status`, `createdAt`, `tableNumber`, `categoryId` for fast dashboard queries.

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

1. **Order Completion Rate**: ≥ 95% of placed orders reach `completed` status without manual intervention.
2. **Real-Time Latency**: Order status updates delivered to customer UI within < 1 second of admin action.
3. **WhatsApp Confirmation Rate**: ≥ 90% of accepted orders trigger a successful Twilio notification.
4. **Menu Load Time**: Menu page renders in < 2 seconds for catalog sizes up to 200 items.
