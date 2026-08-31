---
title: "Comprehensive Documentation Protocol — Advanced Ordering Ecosystem"
tags:
  - #type/protocol
  - #standard/adr
  - #project/ordering-ecosystem
created: 2026-08-28
version: 1.0.0
---

# Comprehensive Documentation Protocol — Advanced Ordering Ecosystem

- **Location**: `documentation/documentation.md`
- **Vault Links**: [[README|Home MOC]] | [[memory|Memory Log]] | [[status|Status Dashboard]] | [[architecture|Architecture]]

---

## 1. Golden Rules of Documentation

1. **Document as You Build**: Never leave documentation for "later". Every feature, schema edit, bug fix, or API change MUST be documented immediately upon completion.
2. **Micro-Detail Precision**: Capture exact function signatures, Mongoose schema fields, API payloads, Socket.IO event names, and file paths. Vague summaries are unacceptable.
3. **Living Memory Update**: Every single session or task completion MUST update [[memory|Memory Log]] and [[status|Status Dashboard]].
4. **Architectural Decision Records (ADRs)**: Any major technical choice (e.g., switching databases, changing real-time strategy, modifying the variation schema) MUST be recorded as an ADR in this document.
5. **Project-Specific Docs**: Feature-level detail belongs in the sub-project's own `docs/` folder (`cafe-little-karachi/docs/` or `the-chai-company/docs/`). Monorepo-level patterns belong here in `/documentation`.

---

## 2. Standard Change Log Format

Whenever code or configuration is modified, append an entry to [[memory|Memory Log]] following this schema:

```markdown
### [YYYY-MM-DD] — [Feature / Bugfix / Refactor Title]
- **Author / Agent**: [Developer or AI Assistant Name]
- **Project**: CLK | TCC | Both
- **Files Modified**:
  - [`src/models/Order.ts`](file:///d:/ordering-system/cafe-little-karachi/src/models/Order.ts) (Added tableNumber field)
  - [`src/pages/api/orders.ts`](file:///d:/ordering-system/cafe-little-karachi/src/pages/api/orders.ts) (Wire tableNumber into order creation)
- **Detailed Summary of Changes**:
  - Added optional `tableNumber: string` field to `Order` schema with index.
  - Validated `tableNumber` in Zod schema (optional string).
  - Emits `table_status_update` Socket.IO event after order placed at table.
- **Verification Performed**:
  - Placed test order with table number — confirmed field persisted in MongoDB.
  - Confirmed Socket.IO event received by admin dashboard.
- **Next Immediate Actions**:
  - Build admin table map editor UI.
```

---

## 3. Inline Code Commentary Standards

### 3.1 TypeScript & React Components
- Use JSDoc headers for all exported utilities, hooks, and context providers.
- Explain *why* complex state logic or Socket.IO subscriptions are structured a certain way.

```typescript
/**
 * CartContext — Global shopping cart state for the ordering flow.
 *
 * Persists cart items across route navigation within a session.
 * Does NOT persist to localStorage — cart resets on browser refresh by design
 * to avoid stale pricing from outdated menu item data.
 *
 * @example
 * const { cartItems, addItem, removeItem, totalAmount } = useCart();
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ...
};
```

### 3.2 Mongoose Schemas
- Add inline comments for non-obvious fields.

```typescript
const OrderSchema = new Schema({
  // totalAmount stored on Order for immutability — never re-fetch from MenuItem
  // prices at time of order since prices may change after placement
  totalAmount: { type: Number, required: true },

  // tableNumber is undefined for takeaway orders
  tableNumber: { type: String, index: true },
});
```

### 3.3 API Routes
- Document the expected request body shape and response format at the top of each route file.

```typescript
/**
 * POST /api/orders
 *
 * Creates a new order and emits a Socket.IO `new_order` event to admin room.
 *
 * Request Body: CreateOrderPayload (see src/types/order.ts)
 * Response: { success: true, orderId: string }
 * Errors: 400 (validation), 500 (DB or socket failure)
 */
```

---

## 4. Architectural Decision Records (ADR Log)

### ADR-001: MongoDB over PostgreSQL
- **Date**: 2026-08-28
- **Status**: Approved
- **Context**: The variation engine requires deeply nested `VariationGroup[]` → `options[]` structures. Relational schemas would require 3 join tables for every menu item query.
- **Decision**: Use MongoDB document model — variation groups are embedded arrays within `MenuItem`.
- **Consequence**: Schema-less flexibility for future variation types; no complex JOIN overhead.

### ADR-002: Hybrid Next.js Routing (App Router + Pages Router)
- **Date**: 2026-08-28
- **Status**: Approved
- **Context**: Next.js App Router does not natively support Socket.IO server embedding (requires persistent HTTP server reference). Pages Router API routes have access to the raw Node.js HTTP server.
- **Decision**: App Router for all UI pages; Pages Router exclusively for `/api/` endpoints.
- **Consequence**: Modern RSC/streaming UI with robust API infrastructure.

### ADR-003: React Context over Redux/Zustand
- **Date**: 2026-08-28
- **Status**: Approved
- **Context**: Cart, Order, and Table state is simple, session-scoped, and does not require time-travel debugging or complex middleware.
- **Decision**: Three purpose-built contexts (`CartContext`, `OrderContext`, `TableContext`).
- **Consequence**: Zero external library overhead; straightforward provider hierarchy.

### ADR-004: Fire-and-Forget Twilio Notifications
- **Date**: 2026-08-28
- **Status**: Approved
- **Context**: WhatsApp notification failures (network errors, invalid phone numbers) must not cause order placement to fail from the customer's perspective.
- **Decision**: Twilio call wrapped in `try/catch` with error logging only. Order is confirmed regardless of Twilio outcome.
- **Consequence**: Improved resilience at the cost of guaranteed notification delivery.

### ADR-005: Monorepo Structure
- **Date**: 2026-08-28
- **Status**: Approved
- **Context**: CLK and TCC share the same architectural DNA — identical tech stacks, shared patterns, and common governance rules. Separate repositories would duplicate documentation and diverge patterns.
- **Decision**: Single monorepo workspace with `cafe-little-karachi/` and `the-chai-company/` as independently deployable sub-projects.
- **Consequence**: Unified governance docs; easy pattern cross-referencing; independent deployments per project.
