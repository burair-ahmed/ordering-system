---
title: "Living Project Memory & Task Tracker — Advanced Ordering Ecosystem"
tags:
  - #type/memory
  - #status/active
  - #project/ordering-ecosystem
created: 2026-08-28
last_updated: 2026-08-28
---

# Living Project Memory & Task Tracker — Advanced Ordering Ecosystem

- **Location**: `documentation/memory.md`
- **Vault Links**: [[README|Home MOC]] | [[status|Status Dashboard]] | [[phases|Roadmap]] | [[architecture|Architecture]]

---

## 1. Project Health & Summary Dashboard

| Metric / Dimension | Status / State | Notes |
|---|---|---|
| Active Phase | **[[phases#phase-4-advanced-features--platters-dine-in--table-management-in-progress\|Phase 4: Advanced Features]]** | Platters (TCC) done. CLK Table Management in progress. |
| Governance & Specs | **100% Complete** | PRD, Architecture, Design System, Security, & Rules in [[README\|documentation/]] |
| Dashboard Tracking | [[status\|Status Dashboard]] & [[memory\|Memory Log]] | Status: Phase 4 at 40% |
| Database | MongoDB + Mongoose ODM | Schemas: `MenuItem`, `Order`, `Category`, `Table`, `Platter` |
| Real-Time | Socket.IO (embedded in Next.js Pages Router) | Events: `new_order`, `order_updated`, `table_status_update` |
| Immediate Goal | **Phase 4: Complete CLK Table Management & Dine-In Order Flow** | Admin map editor, customer table selection, TableContext, Socket.IO table events |

---

## 2. Active Task Board

### ✅ Completed
- [x] Initialize Next.js 15 hybrid (App Router + Pages Router) workspace for CLK and TCC.
- [x] Install all dependencies: `mongoose`, `socket.io`, `framer-motion`, `gsap`, `twilio`, `zod`, `swr`, `cloudinary`, `posthog-js`.
- [x] Create MongoDB schemas: `MenuItem` (with `VariationGroup[]`), `Order`, `Category`.
- [x] Implement variation engine: `VariationGroupEditor` (admin) + `VariationModal` (customer).
- [x] Implement `CartContext` with add/remove/update quantity; cart sticky bottom bar.
- [x] `POST /api/orders` — Zod validation + MongoDB persistence.
- [x] Socket.IO server setup via `/api/socket` handshake endpoint.
- [x] `new_order` event emitted to admin room on order creation.
- [x] `order_updated` event emitted to order room on status change.
- [x] Customer live order tracker (`/order/[orderId]`) with progress bar.
- [x] Admin live dashboard — order queue sorted by time with real-time updates.
- [x] `PATCH /api/updateorderstatus` — status update + Socket.IO emit.
- [x] Bulk category availability toggle (admin panel).
- [x] Bulk price update by percentage (admin panel).
- [x] Analytics dashboard: orders per day chart, top items by revenue, avg order value.
- [x] PostHog cart funnel integration.
- [x] Twilio WhatsApp notification on order acceptance (fire-and-forget).
- [x] Platter schema + admin `PlatterForm` + customer `PlatterCustomizer` (TCC).
- [x] `Table` Mongoose schema (`number`, `capacity`, `status`).

### 🔄 In Progress (Phase 4: Table Management — CLK)
- [ ] Admin table map editor — visual grid of tables with status indicators and capacity settings.
- [ ] `PATCH /api/tables/[id]` — update table status endpoint.
- [ ] Customer table selection screen (`/select-table`).
- [ ] `TableContext` — persist selected table across cart and order submission.
- [ ] Socket.IO `table_status_update` event on table status change.
- [ ] `tableNumber` field wired into `POST /api/orders`.
- [ ] Admin dashboard orders grouped by table number.

### 📋 Upcoming
- [ ] Phase 5: AI-powered menu search with MongoDB Atlas Vector Search.
- [ ] Phase 6: Multi-branch support with `branchId` scoping.

---

## 3. Key Architectural Decisions (ADR Log)

| # | Decision | Rationale | Date |
|---|---|---|---|
| ADR-001 | MongoDB + Mongoose | Document model handles nested `VariationGroup[]` naturally without complex joins | 2026-08-28 |
| ADR-002 | Hybrid Next.js Routing (App + Pages) | Pages Router has better Socket.IO support; App Router for modern UI | 2026-08-28 |
| ADR-003 | React Context over Redux | Cart/Order/Table state is localized enough; avoids library overhead | 2026-08-28 |
| ADR-004 | Fire-and-forget Twilio | Twilio failures must NEVER block order persistence | 2026-08-28 |
| ADR-005 | Cloudinary for media | Auto image optimization, CDN delivery, Next.js Image loader compatible | 2026-08-28 |
| ADR-006 | Monorepo over separate repos | Shared architecture patterns; easier cross-referencing; single governance docs | 2026-08-28 |

---

## 4. File Registry (Core Files)

| File | Purpose | Status |
|---|---|---|
| `src/models/MenuItem.ts` | Mongoose schema with variation groups | ✅ Ready |
| `src/models/Order.ts` | Order schema with status enum | ✅ Ready |
| `src/models/Category.ts` | Category schema | ✅ Ready |
| `src/models/Table.ts` | Table schema (CLK) | ✅ Schema defined, endpoints pending |
| `src/models/Platter.ts` | Platter schema (TCC) | ✅ Ready |
| `src/contexts/CartContext.tsx` | Cart global state | ✅ Ready |
| `src/contexts/OrderContext.tsx` | Active order + Socket.IO | ✅ Ready |
| `src/contexts/TableContext.tsx` | Selected table (CLK) | 🔄 In Progress |
| `src/pages/api/orders.ts` | Order placement + Socket.IO emit | ✅ Ready |
| `src/pages/api/updateorderstatus.ts` | Status update + Socket.IO emit | ✅ Ready |
| `src/pages/api/socket.ts` | Socket.IO handshake endpoint | ✅ Ready |
| `src/pages/api/menu.ts` | Menu CRUD | ✅ Ready |
| `src/app/menu/page.tsx` | Customer menu page | ✅ Ready |
| `src/app/order/[orderId]/page.tsx` | Customer live tracker | ✅ Ready |
| `src/app/(admin)/dashboard/page.tsx` | Admin live order queue | ✅ Ready |
| `src/components/VariationModal.tsx` | Customer variation selector | ✅ Ready |
| `src/components/admin/VariationGroupEditor.tsx` | Admin variation builder | ✅ Ready |

---

## 5. Session Log

### Session 2026-08-28 (Documentation Setup)
- Created root-level monorepo documentation vault in `documentation/`.
- Wrote PRD, Architecture, Design System, Phases, Status, Memory, NEXT_STEPS, Security, Documentation Protocol.
- Updated `.cursorrules`, `AGENTS.md`, `CLAUDE.md` with ordering ecosystem context.
- **Current state**: Documentation fully aligned with ordering ecosystem. Phase 4 CLK Table Management in active development.

### Session 2026-08-31 (CLK Complete Technical Audit & Remediation)
- Installed `@pbakaus/impeccable` design & audit skill suite.
- Ran full 5-dimension technical audit across accessibility, performance, theming, responsive design, and implementation integrity (initial score: 8/20, 39 detector anti-patterns).
- Remediated all 22 audit findings and 39 anti-pattern violations:
  - Cleaned `globals.css`: purged `Arial` font override (restoring `Poppins`), removed `.fixed` and `.pt-16` mobile utility hijacks, cleaned global element pollution, added `prefers-reduced-motion` support.
  - Keyboard A11y: converted `MenuItem.tsx` & `PlatterItem.tsx` interactive cards to accessible elements (`role="button"`, `tabIndex={0}`, Enter/Space handlers, ARIA dialog attributes).
  - Performance: removed `unoptimized={true}` on menu images, added Next.js `<Image priority>` to `Hero.tsx`.
  - Design Tokens & Contrast: eliminated hardcoded hex values (`#741052`, `#d0269b`), replaced 16 gradient text antipatterns with solid `text-primary` tokens, and fixed dark mode contrast.
  - Mobile Touch Targets: scaled all interactive buttons/counters to 44x44px.
- Verified: automated detector passed with **0 anti-pattern violations**, TypeScript build check passed cleanly with `0 errors`.

### Session 2026-08-31 (CLK UX Tester Prompt Refactoring, Complete Agent & Scripts Suite)
- Refactored `food-ordering-ux-tester-skill-prompt.md` into a specialized **`clk-order-ux-tester`** skill prompt for Cafe Little Karachi.
- Built a complete, autonomous Antigravity working agent & skill in [`.agents/skills/clk-order-ux-tester/`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/):
  - **Main Skill**: [`SKILL.md`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/SKILL.md) with quick execution CLI runbook and 10-stage funnel audit criteria.
  - **Subagent Definition**: [`agents/clk_ux_tester_agent.toml`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/agents/clk_ux_tester_agent.toml).
  - **Reference Library**:
    - [`reference/personas.md`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/reference/personas.md) (6 in-depth persona profiles).
    - [`reference/funnel-stages.md`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/reference/funnel-stages.md) (10-stage funnel checklist).
    - [`reference/report-template.md`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/reference/report-template.md) (standard report template).
  - **Automated Diagnostic Scripts**:
    - [`scripts/run-all-personas.mjs`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/scripts/run-all-personas.mjs) (Master test suite runner).
    - [`scripts/check-mobile-ergonomics.mjs`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/scripts/check-mobile-ergonomics.mjs) (44px touch targets, contrast & image optimization analyzer).
    - [`scripts/simulate-order-flow.mjs`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/scripts/simulate-order-flow.mjs) (Endpoint health and persona journey simulator).
    - [`scripts/test-menu-variations.mjs`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/scripts/test-menu-variations.mjs) (Variation pricing & modifier validation).
    - [`scripts/audit-report-generator.mjs`](file:///d:/ordering-system/.agents/skills/clk-order-ux-tester/scripts/audit-report-generator.mjs) (Markdown report compiler).
- **Execution Verification**: Executed `node .agents/skills/clk-order-ux-tester/scripts/run-all-personas.mjs` — successfully passed static analysis, endpoint simulation, and generated [`documentation/audits/clk-ux-audit-latest.md`](file:///d:/ordering-system/documentation/audits/clk-ux-audit-latest.md).

### Session 2026-09-01 (Google Analytics & Microsoft Clarity Complete Setup)
- Updated Google Analytics measurement ID (`G-PPJHLLX7BS`) across `.env` and `.env.production`.
- Created [`ClarityProvider.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/providers/ClarityProvider.tsx) with project ID `ybjh2k8z4c` using Next.js `<Script strategy="afterInteractive">`.
- Updated [`analytics.ts`](file:///d:/ordering-system/cafe-little-karachi/src/app/lib/analytics.ts) to bridge all internal analytics events to Microsoft Clarity custom events.
- Mapped all 10 ordering funnel stages (`CLK_FUNNEL_LANDING` through `CLK_FUNNEL_TRACKING_VIEWED`) across key components: [`TableForm.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/components/TableForm.tsx), [`order/page.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/order/page.tsx), [`MenuItem.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/components/MenuItem.tsx), [`checkout/page.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/checkout/page.tsx), and [`thank-you/page.tsx`](file:///d:/ordering-system/cafe-little-karachi/src/app/thank-you/page.tsx).

