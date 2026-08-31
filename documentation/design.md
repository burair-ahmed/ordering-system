---
title: "UI/UX Design System — Advanced Ordering Ecosystem"
tags:
  - #type/design
  - #tech/tailwind
  - #ui/design-tokens
  - #project/ordering-ecosystem
created: 2026-08-28
version: 1.0.0
---

# UI/UX Design System — Advanced Ordering Ecosystem

- **Location**: `documentation/design.md`
- **Vault Links**: [[README|Home MOC]] | [[PRD|PRD Specs]] | [[architecture|Architecture]] | [[status|Status]]

---

## 1. Design Philosophies

Both platforms share a commitment to **visual excellence** — the user should be impressed at first glance. Each platform has its own personality:

| Platform | Personality | Aesthetic |
|---|---|---|
| **CLK** | Premium, warm, cultural | Pakistani heritage-inspired. Glassmorphism, deep pinks, rich gradients, gold accents |
| **TCC** | Sleek, fast, minimal | Monochromatic dark surfaces, sharp contrasts, fluid micro-animations |

---

## 2. CLK Design Tokens (Cafe Little Karachi)

### 2.1 Core Color Palette

```css
:root {
  /* Brand */
  --clk-primary: #741052;         /* Deep Pink — headings, primary CTAs */
  --clk-secondary: #d0269b;       /* Bright Magenta — gradient end, highlights */
  --clk-accent: #5c0d40;          /* Darker Pink — hover states, borders */

  /* Semantic */
  --clk-success: #10b981;         /* Emerald — order confirmed, available */
  --clk-warning: #f59e0b;         /* Amber — pending, partial */
  --clk-error: #ef4444;           /* Red — cancelled, out of stock */

  /* Surface */
  --clk-bg: #ffffff;
  --clk-surface: #fdf2f8;         /* Faint pink wash */
  --clk-border: #f3e8f0;

  /* Text */
  --clk-text-heading: #741052;
  --clk-text-body: #374151;
  --clk-text-muted: #9ca3af;
}
```

### 2.2 Component Tokens

**Primary Button:**
```jsx
className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
```

**Secondary Button:**
```jsx
className="bg-white border-2 border-[#741052] text-[#741052] font-semibold px-6 py-3 rounded-xl hover:bg-[#741052] hover:text-white transition-all duration-200"
```

**Outline Button:**
```jsx
className="border border-[#741052] text-[#741052] px-4 py-2 rounded-lg hover:bg-[#741052] hover:text-white transition-colors"
```

**Ghost Button:**
```jsx
className="text-[#741052] hover:bg-[#741052]/10 px-4 py-2 rounded-lg transition-colors"
```

### 2.3 Typography

**Main Heading (H1):**
```jsx
className="text-4xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent mb-6"
```

**Section Heading (H2):**
```jsx
className="text-3xl font-bold text-[#741052] mb-4"
```

**Sub-Heading (H3):**
```jsx
className="text-2xl font-semibold text-[#741052] mb-3"
```

**Card Heading:**
```jsx
className="text-xl font-semibold text-[#741052] mb-2"
```

---

## 3. Order Status Color System

Consistent status color coding used across both CLK and TCC:

```css
--status-pending:   #f59e0b;   /* Amber   — awaiting admin action */
--status-accepted:  #3b82f6;   /* Blue    — confirmed by kitchen */
--status-preparing: #8b5cf6;   /* Purple  — being prepared */
--status-ready:     #10b981;   /* Emerald — ready for pickup/serving */
--status-completed: #6b7280;   /* Gray    — archived, done */
--status-cancelled: #ef4444;   /* Red     — cancelled */
```

---

## 4. Component Hierarchy & UX Wireframes

### 4.1 Customer Ordering Flow (CLK)

```
app/
 ├── page.tsx                   # Landing / Hero (GSAP scroll animations)
 ├── menu/
 │    └── page.tsx              # Full menu with category tabs
 ├── cart/
 │    └── page.tsx              # Cart review + table selection
 ├── order/
 │    └── [orderId]/
 │         └── page.tsx         # Live order tracker (Socket.IO)
 └── (admin)/
      ├── dashboard/
      │    └── page.tsx         # Live orders queue (Socket.IO)
      ├── menu/
      │    └── page.tsx         # Menu management CRUD
      └── analytics/
           └── page.tsx         # Revenue & conversion analytics
```

### 4.2 Menu Page Layout

```
+-----------------------------------------------------------+
| [Logo]     Category Tabs: [Starters] [Mains] [Beverages]  |
+-----------------------------------------------------------+
| Grid of MenuItemCard components (3 cols desktop, 1 mobile)|
|                                                           |
| +------------------+   +------------------+              |
| | [Image]          |   | [Image]          |              |
| | Item Name        |   | Item Name        |              |
| | Rs. 450          |   | Rs. 750          |              |
| | [Customize & Add]|   | [Customize & Add]|              |
| +------------------+   +------------------+              |
+-----------------------------------------------------------+
| Sticky Bottom Bar: Cart Summary [3 items · Rs. 1,450 →]   |
+-----------------------------------------------------------+
```

### 4.3 Variation Selection Modal

```
+------------------------------------------+
| Karahi Chicken                     [×]   |
| Base Price: Rs. 650                       |
|------------------------------------------|
| Size *                                    |
|  ○ Half  (+ Rs. 0)                       |
|  ● Full  (+ Rs. 200)                     |
|------------------------------------------|
| Spice Level                               |
|  ○ Mild  ● Medium  ○ Spicy               |
|------------------------------------------|
| Add-ons                                   |
|  ☑ Extra Naan     (+ Rs. 50)             |
|  ☐ Extra Raita    (+ Rs. 30)             |
|------------------------------------------|
| Total: Rs. 900                            |
| [Add to Cart]                             |
+------------------------------------------+
```

### 4.4 Admin Order Queue

```
+-------------------------------------------------------------+
| 🔴 LIVE — 4 Active Orders          [Refresh Off · Socket ✓] |
+-------------------------------------------------------------+
| #ORD-1042  Table 5 · 3 items · Rs. 1,850  ● PENDING        |
| Karahi Full, Naan x2, Lassi      [Accept] [Cancel]          |
|-------------------------------------------------------------|
| #ORD-1041  Takeaway · 2 items · Rs. 490   ● PREPARING      |
| Chai x2, Samosa Platter           [Mark Ready]              |
+-------------------------------------------------------------+
```

---

## 5. Animations & Micro-Interactions

### 5.1 Framer Motion — Standard Transitions

```tsx
// Card entrance animation (use on MenuItemCard, OrderCard)
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

// Staggered list entrance
const containerVariants = {
  visible: { transition: { staggerChildren: 0.08 } }
};
```

### 5.2 Status Badge Transitions
- Status badge color changes animate with a 200ms `backgroundColor` transition.
- New orders appearing in admin queue use a slide-in-from-top animation.

### 5.3 GSAP — Landing Page
- Hero text reveal: `gsap.from('.hero-text', { y: 60, opacity: 0, stagger: 0.15, duration: 0.8 })`.
- Menu category parallax scroll: `ScrollTrigger` pinning category header.

---

## 6. Accessibility (WCAG 2.1 AA)

- All interactive elements have `aria-label` attributes.
- Color contrast ratio ≥ 4.5:1 for all text on backgrounds.
- Keyboard navigation: Tab through menu items, Enter to open variation modal, Escape to close.
- Focus ring: `focus:ring-2 focus:ring-[#741052] focus:ring-offset-2` on all buttons.
- Mobile-first breakpoints: `sm:`, `md:`, `lg:` Tailwind classes used consistently.
