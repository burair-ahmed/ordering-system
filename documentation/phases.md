---
title: "Project Phases & Development Roadmap — Advanced Ordering Ecosystem"
tags:
  - #type/roadmap
  - #phase/mvp
  - #phase/real-time
  - #phase/admin
  - #phase/ai
  - #phase/multi-branch
  - #project/ordering-ecosystem
created: 2026-08-28
last_updated: 2026-08-28
status: Active Plan
---

# Project Phases & Development Roadmap — Advanced Ordering Ecosystem

- **Location**: `documentation/phases.md`
- **Vault Links**: [[README|Home MOC]] | [[PRD|PRD Specs]] | [[architecture|Architecture]] | [[status|Status Dashboard]]

---

## Roadmap Overview

```
+-----------------------------------------------------------------------------------+
| Phase 1: Core MVP — Menu Catalog, Variation Engine & Basic Ordering               | [COMPLETED]
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 2: Real-Time Order Tracking — Socket.IO Dashboard & Status Lifecycle        | [COMPLETED]
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 3: Admin Dashboard — Bulk Management, Analytics & WhatsApp Notifications    | [COMPLETED]
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 4: Advanced Features — Platters, Table Management & Dine-In Flow            | [IN PROGRESS]
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 5: AI Search & Intelligent Recommendations                                  | [PLANNED]
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 6: Multi-Branch Support — Unified Management for Multiple Locations          | [PLANNED]
+-----------------------------------------------------------------------------------+
```

---

## Phase 1: Core MVP — Menu, Variations & Ordering `COMPLETED`

- **Goal**: Deliver a working end-to-end order placement flow with granular item customization.
- **Scope**: Menu catalog, variation engine, cart, order placement, MongoDB persistence.

### Tasks & Checklist
- [x] **Menu System**:
  - [x] `Category` and `MenuItem` Mongoose schemas with variation groups.
  - [x] Admin CRUD for menu items (`POST /api/menu`, `PATCH /api/menu/[id]`).
  - [x] Customer-facing menu page with category tabs and item cards.
  - [x] Cloudinary image upload for menu item photos.
- [x] **Variation Engine**:
  - [x] `VariationGroup` + `options[]` nested schema in `MenuItem`.
  - [x] `VariationGroupEditor` admin component for building variation groups.
  - [x] Customer `VariationModal` — select options, calculate total price, validate required groups.
- [x] **Cart & Order Placement**:
  - [x] `CartContext` with add/remove/update quantity operations.
  - [x] `POST /api/orders` — validate with Zod, persist to MongoDB, return order ID.
  - [x] Cart sticky bottom bar with running total.

---

## Phase 2: Real-Time Order Tracking `COMPLETED`

- **Goal**: Enable instant synchronization between customer order tracker and admin dashboard.
- **Scope**: Socket.IO integration, order status lifecycle, live admin queue.

### Tasks & Checklist
- [x] **Socket.IO Server Setup**:
  - [x] `/api/socket` handshake endpoint embedded in Next.js Pages Router.
  - [x] `new_order` event emitted to admin room after DB save.
  - [x] `order_updated` event emitted to specific order room after status change.
- [x] **Customer Order Tracker**:
  - [x] `/order/[orderId]` page with live progress bar.
  - [x] `OrderContext` managing Socket.IO subscription for the active order.
- [x] **Admin Live Dashboard**:
  - [x] Orders queue sorted by `createdAt` descending, auto-updated on `new_order` events.
  - [x] `PATCH /api/updateorderstatus` — update order status + emit `order_updated`.

---

## Phase 3: Admin Dashboard, Analytics & WhatsApp `COMPLETED`

- **Goal**: Give restaurant operators powerful management tools and automated customer communication.
- **Scope**: Bulk operations, analytics dashboard, Twilio WhatsApp notifications, PostHog integration.

### Tasks & Checklist
- [x] **Bulk Admin Operations**:
  - [x] Bulk availability toggle for category (mark all items in category as unavailable).
  - [x] Bulk price update (percentage increase/decrease applied to category or all items).
- [x] **Analytics Dashboard**:
  - [x] Orders per day chart (last 30 days).
  - [x] Top 10 menu items by revenue.
  - [x] Average order value metric.
  - [x] PostHog cart funnel (add-to-cart → checkout → order placed).
- [x] **Twilio WhatsApp Notifications**:
  - [x] `POST /api/notify-customer` — fire-and-forget Twilio WhatsApp message on order `accepted`.
  - [x] Message template: Order ID, item list, estimated wait, restaurant contact.

---

## Phase 4: Advanced Features — Platters, Dine-In & Table Management `IN PROGRESS`

- **Goal**: Build out CLK's table-based dine-in flow and TCC's platter customization system.
- **Scope**: Platter schema and UI, table map, dine-in ordering flow, TableContext.

### Tasks & Checklist
- [x] **Platter Management (TCC)**:
  - [x] `Platter` Mongoose schema with base price and configurable slots.
  - [x] Admin `PlatterForm` — define slots, allowed items per slot, and upgrade pricing.
  - [x] Customer `PlatterCustomizer` — fill slots from allowed item lists.
- [ ] **Table Management (CLK)**:
  - [ ] `Table` Mongoose schema with `number`, `capacity`, `status` fields.
  - [ ] Admin table map editor — add/remove tables, set capacity.
  - [ ] Customer table selection screen at ordering flow start.
  - [ ] `TableContext` — persist selected table across cart and order submission.
  - [ ] Socket.IO `table_status_update` event when table status changes.
- [ ] **Dine-In Order Flow (CLK)**:
  - [ ] Table-aware order placement — `tableNumber` field on `Order` schema.
  - [ ] Admin dashboard grouping orders by table number.

---

## Phase 5: AI Search & Intelligent Recommendations `PLANNED`

- **Goal**: Reduce time-to-order for customers by surfacing the most relevant items instantly.
- **Scope**: Semantic search across menu items, AI-powered recommendations based on order history.

### Tasks & Checklist
- [ ] **AI-Powered Menu Search**:
  - [ ] Natural language search (e.g., "something spicy with naan") mapped to menu items.
  - [ ] Vector embeddings for menu item descriptions stored in MongoDB Atlas Vector Search.
- [ ] **Recommendation Engine**:
  - [ ] "Customers also ordered" suggestions on item detail view.
  - [ ] Personalized top-picks based on previous session orders.

---

## Phase 6: Multi-Branch Support `PLANNED`

- **Goal**: Allow a restaurant group to manage multiple branch locations under a unified admin.
- **Scope**: Branch registry, per-branch menus, branch-scoped orders, cross-branch analytics.

### Tasks & Checklist
- [ ] **Branch Registry**:
  - [ ] `Branch` Mongoose schema (`name`, `address`, `subdomain`).
  - [ ] `branchId` foreign key added to `MenuItem`, `Order`, `Category`.
- [ ] **Branch-Scoped Operations**:
  - [ ] Orders and menus filtered by active branch context.
  - [ ] Subdomain routing: `branch-name.restaurant.com`.
- [ ] **Super Admin Panel**:
  - [ ] Cross-branch order volume and revenue analytics.
  - [ ] Centralized menu template push to all branches.
