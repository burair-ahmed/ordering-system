---
title: "Security Protocols & Validation Standards — Advanced Ordering Ecosystem"
tags:
  - #type/security
  - #security/validation
  - #security/auth
  - #security/owasp
  - #project/ordering-ecosystem
created: 2026-08-28
version: 1.0.0
---

# Security Protocols & Validation Standards — Advanced Ordering Ecosystem

- **Location**: `documentation/security-and-review.md`
- **Vault Links**: [[README|Home MOC]] | [[PRD|PRD Specs]] | [[architecture|Architecture]] | [[status|Status]]

---

## 1. API Input Validation (Zod)

All API route request bodies MUST be validated with a Zod schema before any database operations. No MongoDB query should run on unvalidated user input.

### Standard Pattern

```typescript
// src/pages/api/orders.ts
import { z } from 'zod';

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  basePrice: z.number().min(0),
  selectedVariations: z.record(z.string()),
  additionalPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  totalPrice: z.number().min(0),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  tableNumber: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().max(500).optional(),
  totalAmount: z.number().min(0),
});

// In handler:
const parsed = createOrderSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: 'Invalid order payload', issues: parsed.error.issues });
}
```

---

## 2. Authentication & Route Protection

### Admin Route Guards

All admin-facing API routes and pages must be protected. Use Next.js middleware to check session/auth token before processing.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
                       request.nextUrl.pathname.startsWith('/api/admin');
  
  if (isAdminRoute) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}
```

### API Route Auth Check

```typescript
// Standard pattern for protected API routes
if (req.method !== 'POST') return res.status(405).end();
const session = await getSession(req); // your auth helper
if (!session || session.role !== 'admin') {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## 3. OWASP Web Security Controls

### 3.1 Injection Prevention
- All MongoDB queries use Mongoose methods with typed parameters — no raw string interpolation in queries.
- `menuItemId` and other ObjectId fields are validated with `z.string().regex(/^[a-f\d]{24}$/i)` before `new mongoose.Types.ObjectId(id)`.

### 3.2 Cross-Site Scripting (XSS) Mitigation
- Next.js automatically escapes JSX output.
- All user-generated text (item names, order notes, customer names) is rendered via React's JSX (`{value}`) — never via `dangerouslySetInnerHTML`.
- Sanitize any rich text fields with `DOMPurify` if HTML content is ever needed.

### 3.3 CSRF Protection
- API routes use `SameSite=Strict` cookies for session tokens.
- For sensitive mutations (order cancellation, price changes), verify the `Origin` header matches the expected domain.

### 3.4 Rate Limiting
- Apply rate limiting on `POST /api/orders` to prevent order flooding.
- Recommended: `express-rate-limit` or Next.js middleware with an in-memory counter per IP.

---

## 4. Sensitive Data Handling

| Data | Classification | Protection |
|---|---|---|
| Customer phone numbers | Sensitive | Stored in DB but never logged in plain text; masked in analytics events |
| Admin passwords | Critical | Hashed with bcrypt (salt rounds ≥ 12); never stored in plain text |
| Twilio credentials | Critical | Environment variables only (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`); never in client bundle |
| MongoDB connection string | Critical | `MONGODB_URI` in `.env.local` only; excluded from `.env.example` (use placeholder) |
| Cloudinary API secret | Critical | Server-side only; never exposed to client |

### Environment Variable Checklist
- [ ] `.env.local` is in `.gitignore` — confirm before every commit.
- [ ] `.env.example` uses placeholder values only (e.g., `MONGODB_URI=mongodb+srv://user:password@cluster`).
- [ ] No API keys or secrets in `src/app/` client components.

---

## 5. Data Validation — Order Integrity

- **Required variation groups**: Client-side AND server-side validation that `isRequired` groups have a selected option.
- **Price verification**: Server MUST recalculate `totalPrice` from DB `basePrice` + selected option `additionalPrice` and compare against client-submitted `totalAmount`. Reject if discrepancy > Rs. 1 (floating point tolerance).
- **Stock/availability check**: `isAvailable: true` verified for each `menuItemId` at order submission time.

---

## 6. Security Code Review Checklist

Before merging any Pull Request, verify:

- [ ] All new API routes validate request bodies with Zod schemas.
- [ ] No new routes expose MongoDB ObjectIds without ObjectId format validation.
- [ ] Admin-only routes check session/role before processing.
- [ ] No credentials, API keys, or connection strings appear in committed code.
- [ ] `console.log` statements removed from production code paths.
- [ ] `totalAmount` is recalculated server-side and cross-checked against client submission.
- [ ] Twilio and Cloudinary calls are wrapped in `try/catch` and never block core order flow.
- [ ] New environment variables are added to `.env.example` with placeholder values.
