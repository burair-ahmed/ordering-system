# CLK 10-Stage Ordering Funnel Specification

This document details the checklist and testing criteria for each stage in Cafe Little Karachi's customer journey.

## Required setup: data-testid attributes

The real browser scripts (`scripts/scenarios.config.mjs`) select elements by
`data-testid`, not by CSS classes or text content, because those are stable
across styling changes and don't produce false failures. Add these attributes
to your components before running the suite — see
`scripts/scenarios.config.mjs` → `REQUIRED_TESTIDS` for the full list. If a
step fails because a testid is missing, that is a real finding worth noting
on its own (it usually means the element also isn't reliably identifiable to
assistive tech), not something to work around.

---

### Stage 1: Landing / Home & Dining Mode Selection
- [ ] Visual Hierarchy: Does the hero section clearly communicate CLK's brand identity?
- [ ] Dining Mode Clarity: Are **Dine-In**, **Delivery**, and **Takeaway** options immediately visible and mutually exclusive?
- [ ] Performance: Does the hero image load with Next.js optimization? Is LCP < 2.0s?

### Stage 2: Table Selection & QR Routing (`/select-table`)
- [ ] Visual Table Map: Are tables displayed in a clear grid with capacity and status indicators?
- [ ] State Persistence: Is the selected table saved in `TableContext` and reflected across navigation?
- [ ] Error States: Are occupied/reserved tables disabled with clear tooltips?

### Stage 3: Menu Discovery & Search
- [ ] Category Tabs: Are all major categories (Karahis, Handis, BBQ, Rice, Breads, Chai) reachable with 1 click?
- [ ] Search Latency: Does live search return filtered results in <150ms without freezing the UI?
- [ ] Dietary/Spice Badges: Are Vegetarian, Mild, Medium, and Teekha icons clearly visible on item cards?

### Stage 4: Granular Item Customization (`VariationModal`)
- [ ] Modal Animation: Does `VariationModal` animate smoothly (Framer Motion) without layout shifts?
- [ ] Dynamic Pricing: Does toggling options (e.g. 1 KG + Rs. 1,000, Extra Boti + Rs. 200) update the total in real time?
- [ ] Required vs Optional: Are required groups (e.g. Portion Size) clearly designated with badges or asterisk indicators?
- [ ] Pre-selection: Are sensible defaults pre-selected (e.g. Medium spice level) to minimize clicks?

### Stage 5: Cart Management & Quantity (`CartContext`)
- [ ] Line-Item Details: Does the cart drawer show all selected modifiers under each item?
- [ ] Quantity Controls: Are `+` and `-` buttons at least 44x44px and responsive?
- [ ] Empty State: Does an empty cart have an enticing CTA directing back to the menu?
- [ ] Special Instructions: Can users add cooking notes per item or order?

### Stage 6: Frictionless Guest Checkout
- [ ] No Mandatory Login: Can users proceed directly as guests?
- [ ] Minimalist Form: Are fields limited to Name, Phone Number, and Delivery Address / Table Number?
- [ ] Validation Timing: Does validation trigger on blur or submission rather than interrupting user keystrokes?

### Stage 7: Fulfillment Verification (Address / Table)
- [ ] Context Accuracy: For Dine-In, is the table number locked and confirmed?
- [ ] Landmark Support: For Delivery, is there a specific field for landmarks/neighborhoods?
- [ ] Delivery Zone Check: Is the address verified against active delivery boundaries?

### Stage 8: Payment Selection & Price Transparency
- [ ] Payment Options: Are COD, Pay at Counter, Card, and Mobile Wallets (EasyPaisa/JazzCash) presented?
- [ ] Itemized Fee Breakdown: Are Subtotal, GST, Delivery Fee, and Packaging Fee listed transparently?
- [ ] Zero Hidden Fees: Does the total match what was displayed on the prior summary?

### Stage 9: Order Placement & Zod Validation
- [ ] Button State: Does "Place Order" show a spinner and prevent double submissions?
- [ ] Error Feedback: If validation fails, does the UI scroll to the first error with human-friendly guidance?
- [ ] Database Persistence: Does `POST /api/orders` persist the order in MongoDB and return a valid `orderId`?

### Stage 10: Real-Time Order Tracking (`/order/[orderId]`)
- [ ] Live WebSocket: Does Socket.IO connect without errors and listen for `order_updated` events?
- [ ] Status Progression: Does the step progress bar animate smoothly across Pending ➔ In Kitchen ➔ Out for Delivery ➔ Delivered?
- [ ] Twilio WhatsApp: Is the WhatsApp notification dispatched to the customer's phone upon kitchen acceptance?
